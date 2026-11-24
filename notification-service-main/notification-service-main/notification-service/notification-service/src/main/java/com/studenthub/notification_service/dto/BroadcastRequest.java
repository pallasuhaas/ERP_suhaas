package com.studenthub.notification_service.dto;

import com.studenthub.notification_service.data.model.TriggerType;

import java.util.List;

public record BroadcastRequest(List<Long> studentIds, TriggerType triggerType, String title, String message) {
}
