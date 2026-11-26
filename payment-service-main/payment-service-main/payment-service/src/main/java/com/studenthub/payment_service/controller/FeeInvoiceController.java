package com.studenthub.payment_service.controller;

import jakarta.validation.Valid;
import com.studenthub.payment_service.data.model.FeeInvoice;
import com.studenthub.payment_service.service.FeeInvoiceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fee-invoices")
public class FeeInvoiceController {

    private final FeeInvoiceService service;

    public FeeInvoiceController(FeeInvoiceService service) {
        this.service = service;
    }

    @GetMapping
    public List<FeeInvoice> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public FeeInvoice getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/student/{studentId}")
    public List<FeeInvoice> getByStudent(@PathVariable Long studentId) {
        return service.getByStudent(studentId);
    }

    @PostMapping
    public FeeInvoice create(@RequestParam Long studentId,
                             @RequestParam Long feeStructureId,
                             @RequestParam(required = false) Long discountId,
                             @Valid @RequestBody FeeInvoice invoice) {

        return service.create(studentId, feeStructureId, discountId, invoice);
    }

    @PutMapping("/{id}")
    public FeeInvoice update(@PathVariable Long id,
                             @Valid @RequestBody FeeInvoice invoice) {
        return service.update(id, invoice);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}