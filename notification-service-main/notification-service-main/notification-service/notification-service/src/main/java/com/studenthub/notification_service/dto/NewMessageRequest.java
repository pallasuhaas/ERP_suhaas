package com.studenthub.notification_service.dto;

import com.studenthub.notification_service.data.model.SenderType;

public record NewMessageRequest(SenderType senderType, String senderName, String content) {
}
