package com.studenthub.student_info_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// BUG-011: lets the portals (5173 parent, 5174 admin, 5175 management) call this service directly.
// Without it the browser's OPTIONS preflight gets 403; today it only works because Vite proxies /api.
// Override per environment with app.cors.allowed-origins=https://admin.example.com,...
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
