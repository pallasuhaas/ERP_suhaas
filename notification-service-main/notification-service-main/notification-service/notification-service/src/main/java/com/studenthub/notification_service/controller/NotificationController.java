package com.studenthub.notification_service.controller;

import com.studenthub.notification_service.data.model.Notification;
import com.studenthub.notification_service.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Notification> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Notification getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/student/{studentId}")
    public List<Notification> getByStudent(@PathVariable Long studentId) {
        return service.getByStudent(studentId);
    }

    @GetMapping("/user/{userId}")
    public List<Notification> getByUser(@PathVariable Long userId) {
        return service.getByUser(userId);
    }

    @PostMapping
    public Notification create(@RequestBody Notification notification) {
        return service.create(notification);
    }

    @PutMapping("/{id}")
    public Notification update(@PathVariable Long id,
                               @RequestBody Notification notification) {
        return service.update(id, notification);
    }

    @PutMapping("/{id}/sent")
    public Notification markAsSent(@PathVariable Long id) {
        return service.markAsSent(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}