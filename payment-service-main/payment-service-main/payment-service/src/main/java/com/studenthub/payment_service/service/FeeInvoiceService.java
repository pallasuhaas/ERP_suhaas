package com.studenthub.payment_service.service;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.payment_service.exception.ResourceNotFoundException;
import com.studenthub.payment_service.client.StudentClient;
import com.studenthub.payment_service.client.dto.StudentDto;
import com.studenthub.payment_service.data.model.*;
import com.studenthub.payment_service.data.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class FeeInvoiceService {

    private final FeeInvoiceRepository invoiceRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final DiscountPolicyRepository discountPolicyRepository;
    private final StudentClient studentClient;
    private final PaymentTransactionRepository transactionRepository;

    public FeeInvoiceService(FeeInvoiceRepository invoiceRepository,
                             FeeStructureRepository feeStructureRepository,
                             DiscountPolicyRepository discountPolicyRepository,
                             StudentClient studentClient,
                             PaymentTransactionRepository transactionRepository) {

        this.invoiceRepository = invoiceRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.discountPolicyRepository = discountPolicyRepository;
        this.studentClient = studentClient;
        this.transactionRepository = transactionRepository;
    }

    public List<FeeInvoice> getAll() {
        return invoiceRepository.findAll();
    }

    public FeeInvoice getById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FeeInvoice not found with id: " + id));
    }

    public List<FeeInvoice> getByStudent(Long studentId) {
        return invoiceRepository.findByStudentId(studentId);
    }

    public FeeInvoice create(Long studentId, Long feeStructureId, Long discountId, FeeInvoice invoice) {

        // 🔥 Call Student Info Service instead of StudentRepository
        StudentDto student = studentClient.getStudentById(studentId);
        if (student == null) {
            throw new ResourceNotFoundException("Student not found in Student Info Service: " + studentId);
        }

        FeeStructure feeStructure = feeStructureRepository.findById(feeStructureId)
                .orElseThrow(() -> new ResourceNotFoundException("FeeStructure not found with id: " + feeStructureId));

        DiscountPolicy discount = null;
        if (discountId != null) {
            discount = discountPolicyRepository.findById(discountId)
                    .orElseThrow(() -> new ResourceNotFoundException("DiscountPolicy not found with id: " + discountId));
        }

        // totalAmount = net payable, discountApplied = rupees taken off, gross = feeStructure.amount
        if (invoice.getInvoiceDate() == null) {
            invoice.setInvoiceDate(LocalDate.now());
        }
        double gross = feeStructure.getAmount();
        double off = 0.0;
        if (discount != null
                && !invoice.getInvoiceDate().isBefore(discount.getValidFrom())
                && !invoice.getInvoiceDate().isAfter(discount.getValidTo())) {
            off = Math.round(gross * discount.getDiscountPercentage()) / 100.0;
        }
        invoice.setDiscountApplied(off);
        invoice.setTotalAmount(gross - off);

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
        getById(id);
        blockIfUsed("Invoice", java.util.Map.of("payment transaction", transactionRepository.countByInvoiceInvoiceId(id)));
        invoiceRepository.deleteById(id);
    }

    // BUG-010: refuse a delete that would break references, and say what is in the way
    private static void blockIfUsed(String what, java.util.Map<String, Long> users) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        users.forEach((name, n) -> { if (n > 0) parts.add(n + " " + name + (n == 1 ? "" : "s")); });
        if (!parts.isEmpty()) {
            String list = parts.size() == 1 ? parts.get(0)
                    : String.join(", ", parts.subList(0, parts.size() - 1)) + " and " + parts.get(parts.size() - 1);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    what + " is still used by " + list + ". Remove or reassign them first.");
        }
    }
}
