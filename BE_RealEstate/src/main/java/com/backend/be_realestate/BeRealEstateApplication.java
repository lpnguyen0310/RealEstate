package com.backend.be_realestate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BeRealEstateApplication {

    public static void main(String[] args) {
        SpringApplication.run(BeRealEstateApplication.class, args);
    }

}
