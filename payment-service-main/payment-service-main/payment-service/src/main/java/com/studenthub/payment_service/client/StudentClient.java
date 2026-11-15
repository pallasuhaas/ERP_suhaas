package com.studenthub.payment_service.client;

import com.studenthub.payment_service.client.dto.StudentDto;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class StudentClient {

    private final WebClient webClient;

    public StudentClient(WebClient studentServiceWebClient) {
        this.webClient = studentServiceWebClient;
    }

    public StudentDto getStudentById(Long studentId) {
        return webClient.get()
                .uri("/api/students/{id}", studentId)
                .retrieve()
                .bodyToMono(StudentDto.class)
                .block(); // synchronous for simplicity
    }
}
