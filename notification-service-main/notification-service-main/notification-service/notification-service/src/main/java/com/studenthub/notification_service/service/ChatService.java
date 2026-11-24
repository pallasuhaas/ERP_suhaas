package com.studenthub.notification_service.service;

import com.studenthub.notification_service.data.model.*;
import com.studenthub.notification_service.data.repository.ChatMessageRepository;
import com.studenthub.notification_service.data.repository.ChatThreadRepository;
import com.studenthub.notification_service.dto.NewMessageRequest;
import com.studenthub.notification_service.dto.NewThreadRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;

    public ChatService(ChatThreadRepository threadRepository, ChatMessageRepository messageRepository) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
    }

    public List<ChatThread> getAllThreads() {
        return threadRepository.findAllByOrderByLastMessageAtDesc();
    }

    public List<ChatThread> getThreadsByStudent(Long studentId) {
        return threadRepository.findByStudentIdOrderByLastMessageAtDesc(studentId);
    }

    public ChatThread getThread(Long threadId) {
        return threadRepository.findById(threadId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chat thread not found with id: " + threadId));
    }

    public ChatThread createThread(NewThreadRequest req) {
        if (req == null || req.studentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required");
        }
        if (req.subject() == null || req.subject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is required");
        }
        LocalDateTime now = LocalDateTime.now();
        ChatThread thread = ChatThread.builder()
                .studentId(req.studentId())
                .department(req.department() != null ? req.department() : ChatDepartment.GENERAL)
                .subject(req.subject().trim())
                .status(ThreadStatus.OPEN)
                .unreadByAdmin(0)
                .unreadByParent(0)
                .createdAt(now)
                .lastMessageAt(now)
                .build();
        return threadRepository.save(thread);
    }

    public List<ChatMessage> getMessages(Long threadId) {
        getThread(threadId);
        return messageRepository.findByThreadIdOrderBySentAtAscMessageIdAsc(threadId);
    }

    // Saves the message, then bumps lastMessageAt and the other side's unread count
    @Transactional
    public ChatMessage addMessage(Long threadId, NewMessageRequest req) {
        ChatThread thread = getThread(threadId);
        if (req == null || req.content() == null || req.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message content is required");
        }
        if (req.content().length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message must be 2000 characters or fewer");
        }
        SenderType sender = req.senderType() != null ? req.senderType() : SenderType.PARENT;
        LocalDateTime now = LocalDateTime.now();

        ChatMessage message = messageRepository.save(ChatMessage.builder()
                .threadId(threadId)
                .senderType(sender)
                .senderName(req.senderName())
                .content(req.content().trim())
                .sentAt(now)
                .build());

        thread.setLastMessageAt(now);
        if (sender == SenderType.ADMIN) {
            thread.setUnreadByParent(thread.getUnreadByParent() + 1);
        } else {
            thread.setUnreadByAdmin(thread.getUnreadByAdmin() + 1);
        }
        threadRepository.save(thread);
        return message;
    }

    public ChatThread markReadByAdmin(Long threadId) {
        ChatThread thread = getThread(threadId);
        thread.setUnreadByAdmin(0);
        return threadRepository.save(thread);
    }

    public ChatThread markReadByParent(Long threadId) {
        ChatThread thread = getThread(threadId);
        thread.setUnreadByParent(0);
        return threadRepository.save(thread);
    }
}
