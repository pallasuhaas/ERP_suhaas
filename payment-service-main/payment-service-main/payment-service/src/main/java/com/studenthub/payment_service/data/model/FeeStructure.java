package com.studenthub.payment_service.data.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "fee_structure")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fee_structure_id")
    private Long feeStructureId;

    @Column(name = "academic_year", nullable = false, length = 20)
    @NotBlank
    @Size(max = 20)
    private String academicYear;

    @Column(name = "grade_level", nullable = false, length = 50)
    @NotBlank
    @Size(max = 50)
    private String gradeLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "fee_type", nullable = false, length = 20)
    @NotNull
    private FeeType feeType;

    @Column(name = "amount", nullable = false)
    @NotNull
    @Positive
    private Double amount;

    @Column(name = "due_date", nullable = false)
    @NotNull
    private LocalDate dueDate;

    @Column(name = "recurring", nullable = false)
    @NotNull
    private Boolean recurring;
}
