package com.studenthub.payment_service.service;

import com.studenthub.payment_service.data.repository.FeeInvoiceRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.payment_service.exception.ResourceNotFoundException;
import com.studenthub.payment_service.data.model.DiscountPolicy;
import com.studenthub.payment_service.data.repository.DiscountPolicyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DiscountPolicyService {

    private final DiscountPolicyRepository repository;
    private final FeeInvoiceRepository invoiceRepository;

    public DiscountPolicyService(DiscountPolicyRepository repository, FeeInvoiceRepository invoiceRepository) {
        this.repository = repository;
        this.invoiceRepository = invoiceRepository;
    }

    public List<DiscountPolicy> getAll() {
        return repository.findAll();
    }

    public DiscountPolicy getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DiscountPolicy not found with id: " + id));
    }

    public DiscountPolicy create(DiscountPolicy policy) {
        validate(policy);
        return repository.save(policy);
    }

    public DiscountPolicy update(Long id, DiscountPolicy updated) {
        DiscountPolicy existing = getById(id);

        existing.setName(updated.getName());
        existing.setCriteria(updated.getCriteria());
        existing.setDiscountPercentage(updated.getDiscountPercentage());
        existing.setValidFrom(updated.getValidFrom());
        existing.setValidTo(updated.getValidTo());

        validate(existing);
        return repository.save(existing);
    }

    public void delete(Long id) {
        getById(id);
        blockIfUsed("Discount policy", java.util.Map.of("invoice", invoiceRepository.countByDiscountPolicyDiscountId(id)));
        repository.deleteById(id);
    }

    // BUG-008b: cross-field / format rules that annotations can't express
    private void validate(DiscountPolicy x) {
        if (x.getValidFrom() != null && x.getValidTo() != null && x.getValidTo().isBefore(x.getValidFrom())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "validTo must be on or after validFrom.");
        }
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
