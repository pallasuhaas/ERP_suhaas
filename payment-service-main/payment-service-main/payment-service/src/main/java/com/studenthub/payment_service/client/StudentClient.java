package com.studenthub.payment_service.client;

import com.studenthub.payment_service.client.dto.StudentDto;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class StudentClient {

    private final WebClient webClient;

    public StudentClient(WebClient studentServiceWebClient) {
        this.webClient = studentServiceWebClient;
    }

    // Returns null when student-info says 404 (caller turns that into a 404 of its own).
    // If student-info is down, WebClientRequestException propagates and becomes a 503.
    public StudentDto getStudentById(Long studentId) {
        try {
            return webClient.get()
                    .uri("/api/students/{id}", studentId)
                    .retrieve()
                    .bodyToMono(StudentDto.class)
                    .block(); // synchronous for simplicity
        } catch (WebClientResponseException.NotFound e) {
            return null;
        }
    }
}
