package com.studenthub.transport_service.data.repository;

import com.studenthub.transport_service.data.model.StudentTripStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentTripStatusRepository extends JpaRepository<StudentTripStatus, Long> {

    List<StudentTripStatus> findByStudentId(Long studentId);

    List<StudentTripStatus> findByTripTripId(Long tripId);
    long countByTripTripId(Long tripId);
}
