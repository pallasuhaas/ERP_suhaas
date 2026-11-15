package com.studenthub.transport_service.controller;

import com.studenthub.transport_service.data.model.StudentTripStatus;
import com.studenthub.transport_service.service.StudentTripStatusService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-trip-status")
public class StudentTripStatusController {

    private final StudentTripStatusService service;

    public StudentTripStatusController(StudentTripStatusService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentTripStatus> getAllStatuses() {
        return service.getAllStatuses();
    }

    @GetMapping("/{id}")
    public StudentTripStatus getStatusById(@PathVariable Long id) {
        return service.getStatusById(id);
    }

    @GetMapping("/student/{studentId}")
    public List<StudentTripStatus> getStatusesByStudent(@PathVariable Long studentId) {
        return service.getStatusesByStudent(studentId);
    }

    @GetMapping("/trip/{tripId}")
    public List<StudentTripStatus> getStatusesByTrip(@PathVariable Long tripId) {
        return service.getStatusesByTrip(tripId);
    }

    @PostMapping
    public StudentTripStatus createStatus(@RequestParam Long studentId,
                                          @RequestParam Long tripId,
                                          @RequestBody StudentTripStatus status) {
        return service.createStatus(studentId, tripId, status);
    }

    @PutMapping("/{id}")
    public StudentTripStatus updateStatus(@PathVariable Long id,
                                          @RequestBody StudentTripStatus status) {
        return service.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteStatus(@PathVariable Long id) {
        service.deleteStatus(id);
    }
}
