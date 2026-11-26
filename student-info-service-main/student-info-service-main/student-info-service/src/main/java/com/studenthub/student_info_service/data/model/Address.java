package com.studenthub.student_info_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "address")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Long addressId;

    @Enumerated(EnumType.STRING)
    @Column(name = "address_type", nullable = false, length = 20)
    @NotNull
    private AddressType addressType;

    @Column(name = "street", nullable = false, length = 255)
    @NotBlank
    @Size(max = 255)
    private String street;

    @Column(name = "city", nullable = false, length = 100)
    @NotBlank
    @Size(max = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 100)
    @NotBlank
    @Size(max = 100)
    private String state;

    @Column(name = "postal_code", nullable = false, length = 20)
    @NotBlank
    @Size(max = 20)
    private String postalCode;

    @Column(name = "country", nullable = false, length = 100)
    @NotBlank
    @Size(max = 100)
    private String country;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
}