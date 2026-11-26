package com.studenthub.notification_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "student_id")
    private Long studentId; // referenced via REST call, not JPA relation

    @Column(name = "user_id")
    private Long userId; // referenced via REST call, not JPA relation

    @Column(name = "title", length = 200)
    @Size(max = 200)
    private String title;

    @Column(name = "message", nullable = false, length = 500)
    @NotBlank
    @Size(max = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 30)
    @NotNull
    private TriggerType triggerType;

    @Enumerated(EnumType.STRING)
    @Column(name = "recipient_type", nullable = false, length = 30)
    @NotNull
    private RecipientType recipientType;

    @Column(name = "location_snapshot", columnDefinition = "JSON")
    private String locationSnapshot; // raw JSON string

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private NotificationStatus status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
