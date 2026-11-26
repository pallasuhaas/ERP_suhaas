package com.studenthub.payment_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "payment_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private FeeInvoice invoice;

    @Column(name = "payment_date", nullable = false)
    @NotNull
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false, length = 20)
    @NotNull
    private PaymentMode paymentMode;

    @Column(name = "amount_paid", nullable = false)
    @NotNull
    @Positive
    private Double amountPaid;

    @Column(name = "reference_number", length = 100)
    @Size(max = 100)
    private String referenceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull
    private PaymentStatus status;
}