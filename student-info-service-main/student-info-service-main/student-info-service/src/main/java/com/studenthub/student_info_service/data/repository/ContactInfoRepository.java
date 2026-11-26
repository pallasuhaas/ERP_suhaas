package com.studenthub.student_info_service.data.repository;

import com.studenthub.student_info_service.data.model.ContactInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContactInfoRepository extends JpaRepository<ContactInfo, Long> {

    List<ContactInfo> findByStudentStudentId(Long studentId);
    void deleteByStudentStudentId(Long studentId);
}
