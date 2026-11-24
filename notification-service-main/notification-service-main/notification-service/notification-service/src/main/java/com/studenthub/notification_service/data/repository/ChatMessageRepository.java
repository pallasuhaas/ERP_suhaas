package com.studenthub.notification_service.data.repository;

import com.studenthub.notification_service.data.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByThreadIdOrderBySentAtAscMessageIdAsc(Long threadId);
}
