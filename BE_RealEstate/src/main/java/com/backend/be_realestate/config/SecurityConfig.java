package com.backend.be_realestate.config;

import com.backend.be_realestate.security.JwtAuthFilter;
import com.backend.be_realestate.security.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler; // <-- add

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults()).exceptionHandling(ex -> ex.authenticationEntryPoint((req,res,e)->res.sendError(401)))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers("/api/auth/**","/oauth2/**","/login/oauth2/**").permitAll()
                        .requestMatchers("/api/properties/**").permitAll()
                        .requestMatchers("/api/cloudinary/**").permitAll()
                        .requestMatchers("/api/maps/**").permitAll()
                        .requestMatchers("/api/amenities/**").permitAll()
                        .requestMatchers("/api/categories/**").permitAll()
                        .requestMatchers("/api/listingtype/**").permitAll()
                        .requestMatchers("/api/payments/**").permitAll()
                        .requestMatchers( "/api/admin/**").permitAll()
                        .anyRequest().authenticated()
                )
                // bật oauth2 login
                .oauth2Login(o -> o
                        .loginPage("/oauth2/authorization/google")
                        .successHandler(oAuth2LoginSuccessHandler)
                )
                // filter JWT cho các request còn lại
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        // http.cors(Customizer.withDefaults()); // nếu FE khác origin
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsService uds, PasswordEncoder encoder) {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(uds);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }
}