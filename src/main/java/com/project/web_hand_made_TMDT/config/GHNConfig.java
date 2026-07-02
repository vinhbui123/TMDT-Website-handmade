package com.project.web_hand_made_TMDT.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class GHNConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
