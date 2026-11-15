package com.studenthub.payment_service.service;

import com.studenthub.payment_service.data.model.*;
import com.studenthub.payment_service.data.repository.FeeInvoiceRepository;
import com.studenthub.payment_service.data.repository.PaymentTransactionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentTransactionService {

    private final PaymentTransactionRepository transactionRepository;
    private final FeeInvoiceRepository invoiceRepository;

    public PaymentTransactionService(PaymentTransactionRepository transactionRepository,
                                     FeeInvoiceRepository invoiceRepository) {
        this.transactionRepository = transactionRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<PaymentTransaction> getAll() {
        return transactionRepository.findAll();
    }

    public PaymentTransaction getById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PaymentTransaction not found with id: " + id));
    }

    public List<PaymentTransaction> getByInvoice(Long invoiceId) {
        return transactionRepository.findByInvoiceInvoiceId(invoiceId);
    }

    public PaymentTransaction create(Long invoiceId, PaymentTransaction transaction) {

        FeeInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("FeeInvoice not found with id: " + invoiceId));

        transaction.setInvoice(invoice);

        return transactionRepository.save(transaction);
    }

    public PaymentTransaction update(Long id, PaymentTransaction updated) {
        PaymentTransaction existing = getById(id);

        existing.setPaymentDate(updated.getPaymentDate());
        existing.setPaymentMode(updated.getPaymentMode());
        existing.setAmountPaid(updated.getAmountPaid());
        existing.setReferenceNumber(updated.getReferenceNumber());
        existing.setStatus(updated.getStatus());

        return transactionRepository.save(existing);
    }

    public void delete(Long id) {
        transactionRepository.deleteById(id);
    }
}