package com.studenthub.student_info_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "enrollment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "enrollment_id")
    private Long enrollmentId;

    @Column(name = "academic_year", nullable = false, length = 20)
    @NotBlank
    @Size(max = 20)
    private String academicYear;

    @Column(name = "grade_level", nullable = false, length = 50)
    @NotBlank
    @Size(max = 50)
    private String gradeLevel;

    @Column(name = "section", nullable = false, length = 50)
    @NotBlank
    @Size(max = 50)
    private String section;

    @Column(name = "start_date", nullable = false)
    @NotNull
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
}