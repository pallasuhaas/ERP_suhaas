package com.studenthub.student_info_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * BUG-010: before a student is deleted for good, ask the other services whether they still hold records
 * for that student (there are no foreign keys across services, so a hard delete would leave orphans).
 * If a service can't be reached we refuse instead of guessing.
 */
@Component
public class CrossServiceRecords {

    private final RestClient http;
    private final String paymentUrl;
    private final String transportUrl;
    private final String notificationUrl;

    public CrossServiceRecords(@Value("${payment.service.url:http://localhost:8092}") String paymentUrl,
                               @Value("${transport.service.url:http://localhost:8093}") String transportUrl,
                               @Value("${notification.service.url:http://localhost:8094}") String notificationUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.http = RestClient.builder().requestFactory(factory).build();
        this.paymentUrl = paymentUrl;
        this.transportUrl = transportUrl;
        this.notificationUrl = notificationUrl;
    }

    /** Record counts per kind, e.g. {"fee invoice": 2, "transport assignment": 0, ...}. */
    public Map<String, Long> countFor(Long studentId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("fee invoice", count(paymentUrl + "/api/fee-invoices/student/" + studentId));
        counts.put("transport assignment", count(transportUrl + "/api/transport-assignments/student/" + studentId));
        counts.put("trip status record", count(transportUrl + "/api/student-trip-status/student/" + studentId));
        counts.put("notification", count(notificationUrl + "/api/notifications/student/" + studentId));
        counts.put("chat thread", count(notificationUrl + "/api/chat/student/" + studentId));
        counts.put("support ticket", count(notificationUrl + "/api/tickets/student/" + studentId));
        return counts;
    }

    private long count(String url) {
        try {
            List<?> list = http.get().uri(url).retrieve().body(List.class);
            return list == null ? 0 : list.size();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Couldn't check the student's records in the other services, so the student was not deleted. Please try again shortly.");
        }
    }
}
