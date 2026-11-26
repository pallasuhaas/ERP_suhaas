package com.studenthub.notification_service.dto;

import com.studenthub.notification_service.data.model.ChatDepartment;

public record NewThreadRequest(Long studentId, ChatDepartment department, String subject) {
}
