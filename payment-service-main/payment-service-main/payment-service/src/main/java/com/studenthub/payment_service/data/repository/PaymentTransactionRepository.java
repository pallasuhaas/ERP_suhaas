package com.studenthub.payment_service.data.repository;

import com.studenthub.payment_service.data.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    List<PaymentTransaction> findByInvoiceInvoiceId(Long invoiceId);
    long countByInvoiceInvoiceId(Long invoiceId);
}
