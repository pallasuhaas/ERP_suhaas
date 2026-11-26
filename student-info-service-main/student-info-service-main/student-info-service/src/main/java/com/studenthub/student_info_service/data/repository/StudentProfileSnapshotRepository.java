package com.studenthub.student_info_service.data.repository;

import com.studenthub.student_info_service.data.model.StudentProfileSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentProfileSnapshotRepository extends JpaRepository<StudentProfileSnapshot, Long> {

    List<StudentProfileSnapshot> findByStudentStudentId(Long studentId);
    void deleteByStudentStudentId(Long studentId);
}
