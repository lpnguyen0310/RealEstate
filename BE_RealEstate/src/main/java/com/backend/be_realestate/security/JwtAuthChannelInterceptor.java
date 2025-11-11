package com.backend.be_realestate.security;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;               // Service của bạn
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null) return message;

        StompCommand cmd = acc.getCommand();

        // A) BẮT BUỘC XÁC THỰC ở CONNECT
        if (StompCommand.CONNECT.equals(cmd)) {
            String authHeader = acc.getFirstNativeHeader("Authorization");
            String jwt = (authHeader != null && authHeader.startsWith("Bearer "))
                    ? authHeader.substring(7) : null;

            if (!StringUtils.hasText(jwt)) {
                log.warn("[WS] CONNECT bị từ chối: thiếu JWT");
                return null; // block
            }

            try {
                if (jwtService.isRefresh(jwt)) {
                    log.warn("[WS] CONNECT bị từ chối: sử dụng refresh token");
                    return null; // block
                }

                String subject = jwtService.getSubject(jwt); // email/phone (tuỳ hệ thống)
                UserDetails ud = userDetailsService.loadUserByUsername(subject);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());

                // principalName = ud.getUsername()
                acc.setUser(auth);
                log.info("[WS] CONNECT OK, principalName={}", auth.getName());
            } catch (RuntimeException e) {
                log.warn("[WS] CONNECT từ chối: {}", e.getMessage());
                return null; // block
            }
        }

        // B) CẤM SUBSCRIBE/SEND tới /user/** khi không có principal
        if (StompCommand.SUBSCRIBE.equals(cmd) || StompCommand.SEND.equals(cmd)) {
            String dest = acc.getDestination();
            if (dest != null && dest.startsWith("/user/") && acc.getUser() == null) {
                log.warn("[WS] Block {} to {}: missing principal", cmd, dest);
                return null;
            }
        }

        return message;
    }
}
