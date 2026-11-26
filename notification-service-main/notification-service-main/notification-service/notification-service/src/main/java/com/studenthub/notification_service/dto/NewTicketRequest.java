package com.studenthub.notification_service.dto;

public record NewTicketRequest(Long studentId, String parentName, String category, String subject, String description) {
}
