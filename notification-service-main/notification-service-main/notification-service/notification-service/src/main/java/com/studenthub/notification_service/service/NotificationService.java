package com.studenthub.notification_service.service;

import com.studenthub.notification_service.data.model.*;
import com.studenthub.notification_service.data.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public List<Notification> getAll() {
        return repository.findAll();
    }

    public Notification getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));
    }

    public List<Notification> getByStudent(Long studentId) {
        return repository.findByStudentId(studentId);
    }

    public List<Notification> getByUser(Long userId) {
        return repository.findByUserId(userId);
    }

    public Notification create(Notification notification) {
        notification.setStatus(NotificationStatus.PENDING);
        return repository.save(notification);
    }

    public Notification markAsSent(Long id) {
        Notification existing = getById(id);
        existing.setStatus(NotificationStatus.SENT);
        existing.setSentAt(LocalDateTime.now());
        return repository.save(existing);
    }

    public Notification update(Long id, Notification updated) {
        Notification existing = getById(id);

        existing.setMessage(updated.getMessage());
        existing.setTriggerType(updated.getTriggerType());
        existing.setRecipientType(updated.getRecipientType());
        existing.setLocationSnapshot(updated.getLocationSnapshot());
        existing.setStatus(updated.getStatus());
        existing.setSentAt(updated.getSentAt());

        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}