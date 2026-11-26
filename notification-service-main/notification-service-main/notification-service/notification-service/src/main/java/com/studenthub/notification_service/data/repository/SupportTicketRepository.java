package com.studenthub.notification_service.data.repository;

import com.studenthub.notification_service.data.model.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
    List<SupportTicket> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}
