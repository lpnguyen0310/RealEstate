package com.backend.be_realestate.security;

import com.backend.be_realestate.security.JwtService;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Chỉ kiểm tra khi client gửi frame CONNECT
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("[Interceptor] Processing CONNECT command...");

            String authHeader = accessor.getFirstNativeHeader("Authorization");
            String jwt = null;

            if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
            }

            // ⭐️ SỬA ĐỔI 1: Nếu không có token, log warning nhưng VẪN CHO PHÉP kết nối
            if (jwt == null) {
                log.warn("WebSocket CONNECT: Thiếu JWT Token (Authorization header). Cho phép kết nối không xác thực.");
                return message; // <-- Vẫn cho phép kết nối
            }

            try {
                // ⭐️ SỬA ĐỔI 2: Nếu là refresh token, log warning nhưng VẪN CHO PHÉP
                if (jwtService.isRefresh(jwt)) {
                    log.warn("WebSocket CONNECT: Không chấp nhận Refresh Token. Cho phép kết nối không xác thực.");
                    return message; // <-- Vẫn cho phép kết nối
                }

                String subject = jwtService.getSubject(jwt); // subject là email/phone

                if (subject != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(subject);

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    // Quan trọng: Đặt Principal (user) vào session WebSocket
                    accessor.setUser(authToken);
                    log.info("WebSocket CONNECT: Đã xác thực user: {}", subject);
                }
            } catch (JwtException | UsernameNotFoundException e) {
                // ⭐️ SỬA ĐỔI 3: Nếu có lỗi, log warning nhưng VẪN CHO PHÉP kết nối
                log.error("WebSocket Authentication Error: {}. Cho phép kết nối không xác thực.", e.getMessage());
                return message; // <-- Vẫn cho phép kết nối
            }
        }

        // Chỉ trả về message nếu mọi thứ OK
        return message;
    }
}