package com.studenthub.payment_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${student.service.url:http://localhost:8091}")
    private String studentServiceUrl;

    @Bean
    public WebClient studentServiceWebClient() {
        return WebClient.builder()
                .baseUrl(studentServiceUrl)
                .build();
    }
}