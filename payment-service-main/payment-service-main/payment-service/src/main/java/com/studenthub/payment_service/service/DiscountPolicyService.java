package com.studenthub.payment_service.service;

import com.studenthub.payment_service.data.model.DiscountPolicy;
import com.studenthub.payment_service.data.repository.DiscountPolicyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DiscountPolicyService {

    private final DiscountPolicyRepository repository;

    public DiscountPolicyService(DiscountPolicyRepository repository) {
        this.repository = repository;
    }

    public List<DiscountPolicy> getAll() {
        return repository.findAll();
    }

    public DiscountPolicy getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("DiscountPolicy not found with id: " + id));
    }

    public DiscountPolicy create(DiscountPolicy policy) {
        return repository.save(policy);
    }

    public DiscountPolicy update(Long id, DiscountPolicy updated) {
        DiscountPolicy existing = getById(id);

        existing.setName(updated.getName());
        existing.setCriteria(updated.getCriteria());
        existing.setDiscountPercentage(updated.getDiscountPercentage());
        existing.setValidFrom(updated.getValidFrom());
        existing.setValidTo(updated.getValidTo());

        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
