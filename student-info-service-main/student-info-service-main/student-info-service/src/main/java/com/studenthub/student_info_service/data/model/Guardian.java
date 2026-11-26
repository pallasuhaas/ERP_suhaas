package com.studenthub.student_info_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "guardian")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guardian {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "guardian_id")
    private Long guardianId;

    @Column(name = "full_name", nullable = false, length = 150)
    @NotBlank
    @Size(max = 150)
    private String fullName;

    @Column(name = "relationship", nullable = false, length = 50)
    @NotBlank
    @Size(max = 50)
    private String relationship;

    @Column(name = "phone", nullable = false, length = 50)
    @NotNull
    @Size(max = 50)
    private String phone;

    @Column(name = "email", length = 150)
    @Email
    @Size(max = 150)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
}
