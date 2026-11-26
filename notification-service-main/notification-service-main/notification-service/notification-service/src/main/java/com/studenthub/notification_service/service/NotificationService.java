package com.studenthub.notification_service.service;

import com.studenthub.notification_service.exception.ResourceNotFoundException;
import com.studenthub.notification_service.data.model.*;
import com.studenthub.notification_service.data.repository.NotificationRepository;
import com.studenthub.notification_service.dto.BroadcastRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
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

    // One notification per student; in-app delivery, so they are stored as SENT right away
    @Transactional
    public List<Notification> broadcast(BroadcastRequest req) {
        if (req == null || req.studentIds() == null || req.studentIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one student is required");
        }
        if (req.message() == null || req.message().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }
        if (req.message().length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message must be 500 characters or fewer");
        }
        TriggerType trigger = req.triggerType() != null ? req.triggerType() : TriggerType.GENERAL;
        LocalDateTime now = LocalDateTime.now();

        List<Notification> batch = req.studentIds().stream()
                .distinct()
                .map(studentId -> Notification.builder()
                        .studentId(studentId)
                        .title(req.title())
                        .message(req.message().trim())
                        .triggerType(trigger)
                        .recipientType(RecipientType.PARENT)
                        .status(NotificationStatus.SENT)
                        .sentAt(now)
                        .build())
                .toList();
        return repository.saveAll(batch);
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
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getSentAt() != null) existing.setSentAt(updated.getSentAt());

        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}