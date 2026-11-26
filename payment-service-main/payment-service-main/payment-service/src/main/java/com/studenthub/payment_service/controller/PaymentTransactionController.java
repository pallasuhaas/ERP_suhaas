package com.studenthub.payment_service.controller;

import jakarta.validation.Valid;
import com.studenthub.payment_service.data.model.PaymentTransaction;
import com.studenthub.payment_service.service.PaymentTransactionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-transactions")
public class PaymentTransactionController {

    private final PaymentTransactionService service;

    public PaymentTransactionController(PaymentTransactionService service) {
        this.service = service;
    }

    @GetMapping
    public List<PaymentTransaction> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public PaymentTransaction getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/invoice/{invoiceId}")
    public List<PaymentTransaction> getByInvoice(@PathVariable Long invoiceId) {
        return service.getByInvoice(invoiceId);
    }

    @PostMapping
    public PaymentTransaction create(@RequestParam Long invoiceId,
                                     @Valid @RequestBody PaymentTransaction transaction) {
        return service.create(invoiceId, transaction);
    }

    @PutMapping("/{id}")
    public PaymentTransaction update(@PathVariable Long id,
                                     @Valid @RequestBody PaymentTransaction transaction) {
        return service.update(id, transaction);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}