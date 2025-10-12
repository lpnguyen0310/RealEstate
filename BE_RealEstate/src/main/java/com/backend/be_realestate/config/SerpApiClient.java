package com.backend.be_realestate.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class SerpApiClient {

    private final WebClient webClient;

    @Value("${serpapi.key}")
    private String apiKey;

    public SerpApiClient(@Value("${serpapi.url}") String baseUrl) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    public Mono<String> searchGoogleMaps(String q, String ll) {
        return webClient.get()
                .uri(uri -> uri
                        .queryParam("engine", "google_maps")
                        .queryParam("q", q)
                        .queryParam("ll", ll) // dạng "@lat,lng,15z"
                        .queryParam("api_key", apiKey)
                        .build())
                .retrieve()
                .bodyToMono(String.class);
    }
}