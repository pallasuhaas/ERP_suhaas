package com.studenthub.notification_service.data.repository;

import com.studenthub.notification_service.data.model.ChatThread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {
    List<ChatThread> findAllByOrderByLastMessageAtDesc();
    List<ChatThread> findByStudentIdOrderByLastMessageAtDesc(Long studentId);
}
