package com.studenthub.payment_service.data.repository;

import com.studenthub.payment_service.data.model.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {

    List<FeeStructure> findByAcademicYear(String academicYear);

    List<FeeStructure> findByGradeLevel(String gradeLevel);
}
