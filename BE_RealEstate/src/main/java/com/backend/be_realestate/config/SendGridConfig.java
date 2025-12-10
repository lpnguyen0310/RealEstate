package com.backend.be_realestate.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class SendGridConfig {
    @Bean
    public WebClient sendGridWebClient(
            @Value("${sendgrid.api-key}") String apiKey
    ) {
        return WebClient.builder()
                .baseUrl("https://api.sendgrid.com/v3")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
