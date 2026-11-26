package com.studenthub.student_info_service.data.repository;

import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.model.StudentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByAdmissionNumber(String admissionNumber);

    List<Student> findByStatus(StudentStatus status);
}