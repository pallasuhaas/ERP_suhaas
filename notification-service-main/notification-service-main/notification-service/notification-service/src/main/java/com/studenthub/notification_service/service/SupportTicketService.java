package com.studenthub.notification_service.service;

import com.studenthub.notification_service.data.model.SenderType;
import com.studenthub.notification_service.data.model.SupportTicket;
import com.studenthub.notification_service.data.model.TicketReply;
import com.studenthub.notification_service.data.model.TicketStatus;
import com.studenthub.notification_service.data.repository.SupportTicketRepository;
import com.studenthub.notification_service.data.repository.TicketReplyRepository;
import com.studenthub.notification_service.dto.NewMessageRequest;
import com.studenthub.notification_service.dto.NewTicketRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketReplyRepository replyRepository;

    public SupportTicketService(SupportTicketRepository ticketRepository, TicketReplyRepository replyRepository) {
        this.ticketRepository = ticketRepository;
        this.replyRepository = replyRepository;
    }

    public List<SupportTicket> getAll() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<SupportTicket> getByStudent(Long studentId) {
        return ticketRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    public SupportTicket getById(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Support ticket not found with id: " + ticketId));
    }

    public SupportTicket create(NewTicketRequest req) {
        if (req == null || req.subject() == null || req.subject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is required");
        }
        if (req.studentId() == null && (req.parentName() == null || req.parentName().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId or parentName is required");
        }
        LocalDateTime now = LocalDateTime.now();
        return ticketRepository.save(SupportTicket.builder()
                .studentId(req.studentId())
                .parentName(req.parentName())
                .category(req.category() == null || req.category().isBlank() ? "GENERAL" : req.category().trim())
                .subject(req.subject().trim())
                .description(req.description())
                .status(TicketStatus.OPEN)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    public List<TicketReply> getReplies(Long ticketId) {
        getById(ticketId);
        return replyRepository.findByTicketIdOrderBySentAtAscReplyIdAsc(ticketId);
    }

    // The first admin reply on an OPEN ticket moves it to IN_PROGRESS
    @Transactional
    public TicketReply addReply(Long ticketId, NewMessageRequest req) {
        SupportTicket ticket = getById(ticketId);
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ticket is closed");
        }
        if (req == null || req.content() == null || req.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply content is required");
        }
        if (req.content().length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply must be 2000 characters or fewer");
        }
        SenderType sender = req.senderType() != null ? req.senderType() : SenderType.PARENT;
        LocalDateTime now = LocalDateTime.now();

        TicketReply reply = replyRepository.save(TicketReply.builder()
                .ticketId(ticketId)
                .senderType(sender)
                .senderName(req.senderName())
                .content(req.content().trim())
                .sentAt(now)
                .build());

        if (sender == SenderType.ADMIN && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        ticket.setUpdatedAt(now);
        ticketRepository.save(ticket);
        return reply;
    }

    public SupportTicket updateStatus(Long ticketId, TicketStatus status) {
        SupportTicket ticket = getById(ticketId);
        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    @Transactional
    public void delete(Long ticketId) {
        getById(ticketId);
        replyRepository.deleteByTicketId(ticketId);
        ticketRepository.deleteById(ticketId);
    }
}
