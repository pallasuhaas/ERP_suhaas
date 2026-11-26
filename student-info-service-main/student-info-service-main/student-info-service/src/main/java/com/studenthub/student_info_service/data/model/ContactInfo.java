package com.studenthub.student_info_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "contact_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contact_id")
    private Long contactId;

    @Column(name = "email", nullable = false, length = 150)
    @NotBlank
    @Email
    @Size(max = 150)
    private String email;

    @Column(name = "phone", nullable = false, length = 50)
    @NotBlank
    @Size(max = 50)
    private String phone;

    @Column(name = "alternate_phone", length = 50)
    @Size(max = 50)
    private String alternatePhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
}
