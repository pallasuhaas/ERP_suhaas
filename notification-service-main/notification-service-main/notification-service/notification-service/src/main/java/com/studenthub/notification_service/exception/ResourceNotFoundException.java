package com.studenthub.notification_service.exception;

// BUG-006: thrown when a requested record does not exist; mapped to HTTP 404 by GlobalExceptionHandler.
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
