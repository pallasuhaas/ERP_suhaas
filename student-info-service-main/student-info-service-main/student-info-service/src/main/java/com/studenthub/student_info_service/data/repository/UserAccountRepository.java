package com.studenthub.student_info_service.data.repository;

import com.studenthub.student_info_service.data.model.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByUsername(String username);

    Optional<UserAccount> findByStudentStudentId(Long studentId);
}