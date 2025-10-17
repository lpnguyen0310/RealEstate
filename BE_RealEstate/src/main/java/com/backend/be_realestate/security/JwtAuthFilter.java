package com.backend.be_realestate.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final UserDetailsService uds;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        try {
            String header = req.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                String token = header.substring(7);

                if (jwt.isValid(token) && !jwt.isRefresh(token)) {
                    String subject = jwt.getSubject(token);     // username/email
                    Long uid = jwt.getUserId(token);

                    UserDetails user = uds.loadUserByUsername(subject);

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

                    // Giữ uid để SecurityUtils đọc ra
                    auth.setDetails(java.util.Map.of("uid", uid));

                    // (Tuỳ chọn) Nếu muốn thêm remoteAddress/sessionId:
                    // var webDetails = new WebAuthenticationDetailsSource().buildDetails(req);
                    // auth.setDetails(Map.of("uid", uid, "web", webDetails));

                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception ex) {
            // log nhẹ tay, đừng chặn request
            // logger.debug("JWT filter skipped: {}", ex.getMessage());
        }

        chain.doFilter(req, res);
    }
}
