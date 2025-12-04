package com.backend.be_realestate.controller;

import com.backend.be_realestate.config.SerpApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/maps")
@CrossOrigin(origins = {"http://localhost:5173"}, allowCredentials = "true")
@RequiredArgsConstructor
public class MapController {
    private final SerpApiClient serp;

    // GET /api/maps/nearby?q=siêu thị&lat=10.79&lng=106.68&zoom=15
    @GetMapping("/nearby")
    public Mono<String> nearby(
            @RequestParam String q,
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "15") int zoom
    ) {
        String ll = "@" + lat + "," + lng + "," + zoom + "z";
        return serp.searchGoogleMaps(q, ll);
    }


    @GetMapping("/geocode")
    public Mono<String> geocode(@RequestParam("q") String address) {
        return serp.geocodeAddress(address);
    }
}
