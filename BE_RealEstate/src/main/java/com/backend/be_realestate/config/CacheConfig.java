package com.backend.be_realestate.config;

import com.backend.be_realestate.security.register.OtpRecord;
import com.backend.be_realestate.security.register.TicketRecord;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfig {

    @Bean
    public Cache<String, OtpRecord> otpCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(5))
                .maximumSize(100_000)
                .build();
    }

    @Bean
    public Cache<String, TicketRecord> ticketCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(10))
                .maximumSize(100_000)
                .build();
    }

    // Đếm số lần gửi theo key = "email:yyyyMMdd" (24h)
    @Bean
    public Cache<String, Integer> otpDailyCounter() {
        return Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofHours(24))
                .maximumSize(100_000)
                .build();
    }
}
