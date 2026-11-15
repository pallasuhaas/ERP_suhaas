package com.studenthub.payment_service.data.repository;

import com.studenthub.payment_service.data.model.DiscountPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscountPolicyRepository extends JpaRepository<DiscountPolicy, Long> {
}
