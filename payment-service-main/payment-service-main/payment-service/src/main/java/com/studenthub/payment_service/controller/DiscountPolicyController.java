package com.studenthub.payment_service.controller;

import com.studenthub.payment_service.data.model.DiscountPolicy;
import com.studenthub.payment_service.service.DiscountPolicyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discount-policies")
public class DiscountPolicyController {

    private final DiscountPolicyService service;

    public DiscountPolicyController(DiscountPolicyService service) {
        this.service = service;
    }

    @GetMapping
    public List<DiscountPolicy> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public DiscountPolicy getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public DiscountPolicy create(@RequestBody DiscountPolicy policy) {
        return service.create(policy);
    }

    @PutMapping("/{id}")
    public DiscountPolicy update(@PathVariable Long id,
                                 @RequestBody DiscountPolicy policy) {
        return service.update(id, policy);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
