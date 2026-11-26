package com.studenthub.transport_service.data.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "driver")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "full_name", nullable = false, length = 150)
    @NotBlank
    @Size(max = 150)
    private String fullName;

    @Column(name = "license_number", nullable = false, unique = true, length = 100)
    @NotBlank
    @Size(max = 100)
    private String licenseNumber;

    @Column(name = "contact_number", nullable = false, length = 50)
    @NotBlank
    @Size(max = 50)
    private String contactNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false, length = 20)
    @NotNull
    private EmploymentStatus employmentStatus;
}