package com.studenthub.payment_service.client.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDto {
    private Long studentId;
    private String firstName;
    private String lastName;
    private String gradeLevel;
    private String section;
}