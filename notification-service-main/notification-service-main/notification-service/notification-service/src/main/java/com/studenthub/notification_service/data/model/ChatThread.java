package com.studenthub.notification_service.data.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_thread")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "thread_id")
    private Long threadId;

    @Column(name = "student_id", nullable = false)
    private Long studentId; // referenced via REST call, not JPA relation

    @Enumerated(EnumType.STRING)
    @Column(name = "department", nullable = false, length = 30)
    private ChatDepartment department;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ThreadStatus status;

    @Column(name = "unread_by_admin", nullable = false)
    private Integer unreadByAdmin;

    @Column(name = "unread_by_parent", nullable = false)
    private Integer unreadByParent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;
}
