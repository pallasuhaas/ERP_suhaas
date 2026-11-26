package com.studenthub.payment_service.data.repository;

import com.studenthub.payment_service.data.model.FeeInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeInvoiceRepository extends JpaRepository<FeeInvoice, Long> {

    List<FeeInvoice> findByStudentId(Long studentId);

    List<FeeInvoice> findByStatus(String status);
    long countByFeeStructureFeeStructureId(Long feeStructureId);
    long countByDiscountPolicyDiscountId(Long discountId);
}
