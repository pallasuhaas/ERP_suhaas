package com.studenthub.notification_service.controller;

import com.studenthub.notification_service.data.model.SupportTicket;
import com.studenthub.notification_service.data.model.TicketReply;
import com.studenthub.notification_service.data.model.TicketStatus;
import com.studenthub.notification_service.dto.NewMessageRequest;
import com.studenthub.notification_service.dto.NewTicketRequest;
import com.studenthub.notification_service.service.SupportTicketService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class SupportTicketController {

    private final SupportTicketService service;

    public SupportTicketController(SupportTicketService service) {
        this.service = service;
    }

    @GetMapping
    public List<SupportTicket> getAll() {
        return service.getAll();
    }

    @GetMapping("/student/{studentId}")
    public List<SupportTicket> getByStudent(@PathVariable Long studentId) {
        return service.getByStudent(studentId);
    }

    @GetMapping("/{ticketId}")
    public SupportTicket getById(@PathVariable Long ticketId) {
        return service.getById(ticketId);
    }

    @PostMapping
    public SupportTicket create(@RequestBody NewTicketRequest request) {
        return service.create(request);
    }

    @GetMapping("/{ticketId}/replies")
    public List<TicketReply> getReplies(@PathVariable Long ticketId) {
        return service.getReplies(ticketId);
    }

    @PostMapping("/{ticketId}/replies")
    public TicketReply addReply(@PathVariable Long ticketId, @RequestBody NewMessageRequest request) {
        return service.addReply(ticketId, request);
    }

    @PatchMapping("/{ticketId}/status")
    public SupportTicket updateStatus(@PathVariable Long ticketId, @RequestParam TicketStatus status) {
        return service.updateStatus(ticketId, status);
    }

    @DeleteMapping("/{ticketId}")
    public void delete(@PathVariable Long ticketId) {
        service.delete(ticketId);
    }
}
