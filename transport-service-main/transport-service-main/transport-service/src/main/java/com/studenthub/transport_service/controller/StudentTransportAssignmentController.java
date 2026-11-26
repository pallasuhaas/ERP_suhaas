package com.studenthub.transport_service.controller;

import jakarta.validation.Valid;
import com.studenthub.transport_service.data.model.StudentTransportAssignment;
import com.studenthub.transport_service.service.StudentTransportAssignmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport-assignments")
public class StudentTransportAssignmentController {

    private final StudentTransportAssignmentService service;

    public StudentTransportAssignmentController(StudentTransportAssignmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentTransportAssignment> getAllAssignments() {
        return service.getAllAssignments();
    }

    @GetMapping("/{id}")
    public StudentTransportAssignment getAssignmentById(@PathVariable Long id) {
        return service.getAssignmentById(id);
    }

    @GetMapping("/student/{studentId}")
    public List<StudentTransportAssignment> getAssignmentsByStudent(@PathVariable Long studentId) {
        return service.getAssignmentsByStudent(studentId);
    }

    @PostMapping
    public StudentTransportAssignment createAssignment(@RequestParam Long studentId,
                                                       @RequestParam Long routeId,
                                                       @RequestParam Long vehicleId,
                                                       @Valid @RequestBody StudentTransportAssignment assignment) {
        return service.createAssignment(studentId, routeId, vehicleId, assignment);
    }

    @PutMapping("/{id}")
    public StudentTransportAssignment updateAssignment(@PathVariable Long id,
                                                       @Valid @RequestBody StudentTransportAssignment assignment) {
        return service.updateAssignment(id, assignment);
    }

    @DeleteMapping("/{id}")
    public void deleteAssignment(@PathVariable Long id) {
        service.deleteAssignment(id);
    }
}
