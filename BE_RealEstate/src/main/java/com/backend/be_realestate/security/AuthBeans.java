package com.backend.be_realestate.security;

import com.backend.be_realestate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class AuthBeans {
    private final UserRepository userRepo;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepo.findByIdentifier(username)
                .map(u -> User.withUsername(u.getEmail() != null ? u.getEmail() : u.getPhone())
                        .password(u.getPasswordHash())
                        .authorities(
                                u.getRoles()==null ?
                                        java.util.List.of() :
                                        u.getRoles().stream()
                                                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getCode()))
                                                .collect(Collectors.toList())
                        )
                        .accountLocked(!Boolean.TRUE.equals(u.getIsActive()))
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
