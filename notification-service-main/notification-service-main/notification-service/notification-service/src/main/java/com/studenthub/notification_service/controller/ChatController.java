package com.studenthub.notification_service.controller;

import com.studenthub.notification_service.data.model.ChatMessage;
import com.studenthub.notification_service.data.model.ChatThread;
import com.studenthub.notification_service.dto.NewMessageRequest;
import com.studenthub.notification_service.dto.NewThreadRequest;
import com.studenthub.notification_service.service.ChatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService service;

    public ChatController(ChatService service) {
        this.service = service;
    }

    @GetMapping
    public List<ChatThread> getAllThreads() {
        return service.getAllThreads();
    }

    @GetMapping("/student/{studentId}")
    public List<ChatThread> getThreadsByStudent(@PathVariable Long studentId) {
        return service.getThreadsByStudent(studentId);
    }

    @PostMapping
    public ChatThread createThread(@RequestBody NewThreadRequest request) {
        return service.createThread(request);
    }

    @GetMapping("/{threadId}/messages")
    public List<ChatMessage> getMessages(@PathVariable Long threadId) {
        return service.getMessages(threadId);
    }

    @PostMapping("/{threadId}/messages")
    public ChatMessage addMessage(@PathVariable Long threadId, @RequestBody NewMessageRequest request) {
        return service.addMessage(threadId, request);
    }

    @PatchMapping("/{threadId}/read-admin")
    public ChatThread markReadByAdmin(@PathVariable Long threadId) {
        return service.markReadByAdmin(threadId);
    }

    @PatchMapping("/{threadId}/read-parent")
    public ChatThread markReadByParent(@PathVariable Long threadId) {
        return service.markReadByParent(threadId);
    }
}
