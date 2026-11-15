package com.studenthub.student_info_service.data.repository;

import com.studenthub.student_info_service.data.model.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuardianRepository extends JpaRepository<Guardian, Long> {

    List<Guardian> findByStudentStudentId(Long studentId);
}