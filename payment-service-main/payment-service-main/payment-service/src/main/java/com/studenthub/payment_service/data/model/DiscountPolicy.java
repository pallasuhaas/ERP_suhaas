package com.studenthub.payment_service.data.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "discount_policy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discount_id")
    private Long discountId;

    @Column(name = "name", nullable = false, length = 100)
    @NotBlank
    @Size(max = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "criteria", nullable = false, length = 20)
    @NotNull
    private DiscountCriteria criteria;

    @Column(name = "discount_percentage", nullable = false)
    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Double discountPercentage;

    @Column(name = "valid_from", nullable = false)
    @NotNull
    private LocalDate validFrom;

    @Column(name = "valid_to", nullable = false)
    @NotNull
    private LocalDate validTo;
}
