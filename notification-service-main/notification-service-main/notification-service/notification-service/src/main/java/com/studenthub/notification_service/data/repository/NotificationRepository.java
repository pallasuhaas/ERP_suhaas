package com.studenthub.notification_service.data.repository;

import com.studenthub.notification_service.data.model.Notification;
import com.studenthub.notification_service.data.model.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByStudentId(Long studentId);

    List<Notification> findByUserId(Long userId);

    List<Notification> findByStatus(NotificationStatus status);
}
