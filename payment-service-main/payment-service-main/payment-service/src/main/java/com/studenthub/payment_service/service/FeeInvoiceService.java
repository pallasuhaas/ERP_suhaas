package com.studenthub.payment_service.service;

import com.studenthub.payment_service.client.StudentClient;
import com.studenthub.payment_service.client.dto.StudentDto;
import com.studenthub.payment_service.data.model.*;
import com.studenthub.payment_service.data.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeeInvoiceService {

    private final FeeInvoiceRepository invoiceRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final DiscountPolicyRepository discountPolicyRepository;
    private final StudentClient studentClient;

    public FeeInvoiceService(FeeInvoiceRepository invoiceRepository,
                             FeeStructureRepository feeStructureRepository,
                             DiscountPolicyRepository discountPolicyRepository,
                             StudentClient studentClient) {

        this.invoiceRepository = invoiceRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.discountPolicyRepository = discountPolicyRepository;
        this.studentClient = studentClient;
    }

    public List<FeeInvoice> getAll() {
        return invoiceRepository.findAll();
    }

    public FeeInvoice getById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FeeInvoice not found with id: " + id));
    }

    public List<FeeInvoice> getByStudent(Long studentId) {
        return invoiceRepository.findByStudentId(studentId);
    }

    public FeeInvoice create(Long studentId, Long feeStructureId, Long discountId, FeeInvoice invoice) {

        // 🔥 Call Student Info Service instead of StudentRepository
        StudentDto student = studentClient.getStudentById(studentId);
        if (student == null) {
            throw new RuntimeException("Student not found in Student Info Service: " + studentId);
        }

        FeeStructure feeStructure = feeStructureRepository.findById(feeStructureId)
                .orElseThrow(() -> new RuntimeException("FeeStructure not found with id: " + feeStructureId));

        DiscountPolicy discount = null;
        if (discountId != null) {
            discount = discountPolicyRepository.findById(discountId)
                    .orElseThrow(() -> new RuntimeException("DiscountPolicy not found with id: " + discountId));
        }

        // We only store the studentId, not the full Student entity
        invoice.setStudentId(student.getStudentId());
        invoice.setFeeStructure(feeStructure);
        invoice.setDiscountPolicy(discount);

        return invoiceRepository.save(invoice);
    }

    public FeeInvoice update(Long id, FeeInvoice updated) {
        FeeInvoice existing = getById(id);

        existing.setInvoiceDate(updated.getInvoiceDate());
        existing.setDueDate(updated.getDueDate());
        existing.setTotalAmount(updated.getTotalAmount());
        existing.setStatus(updated.getStatus());
        existing.setDiscountApplied(updated.getDiscountApplied());

        return invoiceRepository.save(existing);
    }

    public void delete(Long id) {
        invoiceRepository.deleteById(id);
    }
}