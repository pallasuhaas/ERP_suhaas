package com.studenthub.notification_service.controller;

import jakarta.validation.Valid;
import com.studenthub.notification_service.data.model.ChatDepartment;
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
    public ChatThread createThread(@Valid @RequestBody NewThreadRequest request) {
        return service.createThread(request);
    }

    // Parent portal: get-or-create. department/subject accepted in the JSON body or as query params.
    @PostMapping("/student/{studentId}")
    public ChatThread getOrCreateThread(@PathVariable Long studentId,
                                        @RequestParam(required = false) ChatDepartment department,
                                        @RequestParam(required = false) String subject,
                                        @Valid @RequestBody(required = false) NewThreadRequest body) {
        ChatDepartment dept = department != null ? department : (body != null ? body.department() : null);
        String subj = subject != null ? subject : (body != null ? body.subject() : null);
        return service.getOrCreateThread(studentId, dept, subj);
    }

    @GetMapping("/{threadId}/messages")
    public List<ChatMessage> getMessages(@PathVariable Long threadId) {
        return service.getMessages(threadId);
    }

    @PostMapping("/{threadId}/messages")
    public ChatMessage addMessage(@PathVariable Long threadId, @Valid @RequestBody NewMessageRequest request) {
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
