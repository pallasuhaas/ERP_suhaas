package com.studenthub.student_info_service.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * BUG-006 / BUG-007 / BUG-009 / BUG-010: one place that turns exceptions into proper HTTP status codes
 * and a consistent body {timestamp, status, error, message, path}. The admin UI shows `message`.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Pattern DUPLICATE = Pattern.compile("Duplicate entry '([^']*)' for key '([^']*)'");
    private static final Pattern NOT_NULL = Pattern.compile("Column '([^']*)' cannot be null");
    private static final Pattern TOO_LONG = Pattern.compile("Data too long for column '([^']*)'");

    // 404 — record does not exist
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> notFound(ResourceNotFoundException e, HttpServletRequest req) {
        return error(HttpStatus.NOT_FOUND, e.getMessage(), req);
    }

    // Explicit status thrown by service code (400 / 404 / 409 ...)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> statusException(ResponseStatusException e, HttpServletRequest req) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        return error(status, e.getReason() != null ? e.getReason() : status.getReasonPhrase(), req);
    }

    // 400 — @Valid request body failed
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> invalidBody(MethodArgumentNotValidException e, HttpServletRequest req) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + " " + f.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining("; "));
        if (msg.isBlank()) {
            msg = e.getBindingResult().getGlobalErrors().stream()
                    .map(g -> g.getDefaultMessage()).collect(Collectors.joining("; "));
        }
        return error(HttpStatus.BAD_REQUEST, msg.isBlank() ? "Invalid request data." : msg, req);
    }

    // 400 — Bean Validation failed when the entity was saved (e.g. an older row that breaks a newer rule)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> constraint(ConstraintViolationException e, HttpServletRequest req) {
        String msg = e.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + " " + v.getMessage())
                .distinct()
                .collect(Collectors.joining("; "));
        return error(HttpStatus.BAD_REQUEST, msg.isBlank() ? "Invalid data." : msg, req);
    }

    // 400 — body missing, not JSON, or a value of the wrong type / unknown enum
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException e, HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST, "Request body is missing or contains an invalid value.", req);
    }

    // 400 — e.g. /api/students/abc or ?status=BOGUS
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> typeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST, "Invalid value '" + e.getValue() + "' for '" + e.getName() + "'.", req);
    }

    // 400 — required ?param missing
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> missingParam(MissingServletRequestParameterException e, HttpServletRequest req) {
        return error(HttpStatus.BAD_REQUEST, "Missing required parameter '" + e.getParameterName() + "'.", req);
    }

    // 409 / 400 — database constraint (duplicate, still referenced, NOT NULL, too long)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> integrity(DataIntegrityViolationException e, HttpServletRequest req) {
        String root = e.getMostSpecificCause() != null ? String.valueOf(e.getMostSpecificCause().getMessage()) : "";
        Matcher m;
        if ((m = DUPLICATE.matcher(root)).find()) {
            return error(HttpStatus.CONFLICT, "A record with '" + m.group(1) + "' already exists.", req);
        }
        if (root.contains("foreign key constraint fails")) {
            String msg = "DELETE".equalsIgnoreCase(req.getMethod())
                    ? "This record is still used by other records, so it can't be deleted. Remove or reassign those first."
                    : "This change refers to a record that doesn't exist or is still in use.";
            return error(HttpStatus.CONFLICT, msg, req);
        }
        if ((m = NOT_NULL.matcher(root)).find()) {
            return error(HttpStatus.BAD_REQUEST, "Required field '" + m.group(1) + "' is missing.", req);
        }
        if ((m = TOO_LONG.matcher(root)).find()) {
            return error(HttpStatus.BAD_REQUEST, "Value for '" + m.group(1) + "' is too long.", req);
        }
        log.warn("Unclassified data integrity violation on {} {}: {}", req.getMethod(), req.getRequestURI(), root);
        return error(HttpStatus.CONFLICT, "The change conflicts with existing data.", req);
    }

    static ResponseEntity<Map<String, Object>> error(HttpStatus status, String message, HttpServletRequest req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", req.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
