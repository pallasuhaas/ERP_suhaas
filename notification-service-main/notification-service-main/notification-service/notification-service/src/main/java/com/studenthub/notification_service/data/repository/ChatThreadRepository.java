package com.studenthub.notification_service.data.repository;

import com.studenthub.notification_service.data.model.ChatDepartment;
import com.studenthub.notification_service.data.model.ChatThread;
import com.studenthub.notification_service.data.model.ThreadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {
    List<ChatThread> findAllByOrderByLastMessageAtDesc();
    List<ChatThread> findByStudentIdOrderByLastMessageAtDesc(Long studentId);
    Optional<ChatThread> findFirstByStudentIdAndDepartmentAndStatusOrderByLastMessageAtDesc(
            Long studentId, ChatDepartment department, ThreadStatus status);
}
