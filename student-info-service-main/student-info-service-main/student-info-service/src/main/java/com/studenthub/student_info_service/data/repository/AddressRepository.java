package com.studenthub.student_info_service.data.repository;

import com.studenthub.student_info_service.data.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByStudentStudentId(Long studentId);
}