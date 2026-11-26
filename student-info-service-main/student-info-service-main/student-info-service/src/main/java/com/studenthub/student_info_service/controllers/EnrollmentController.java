package com.studenthub.student_info_service.controller;

import jakarta.validation.Valid;
import com.studenthub.student_info_service.data.model.Enrollment;
import com.studenthub.student_info_service.service.EnrollmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentService service;

    public EnrollmentController(EnrollmentService service) {
        this.service = service;
    }

    @GetMapping("/student/{studentId}")
    public List<Enrollment> getEnrollmentsByStudent(@PathVariable Long studentId) {
        return service.getEnrollmentsByStudent(studentId);
    }

    @GetMapping("/{id}")
    public Enrollment getEnrollmentById(@PathVariable Long id) {
        return service.getEnrollmentById(id);
    }

    @PostMapping("/student/{studentId}")
    public Enrollment createEnrollment(@PathVariable Long studentId,
                                       @Valid @RequestBody Enrollment enrollment) {
        return service.createEnrollment(studentId, enrollment);
    }

    @PutMapping("/{id}")
    public Enrollment updateEnrollment(@PathVariable Long id,
                                       @Valid @RequestBody Enrollment enrollment) {
        return service.updateEnrollment(id, enrollment);
    }

    @DeleteMapping("/{id}")
    public void deleteEnrollment(@PathVariable Long id) {
        service.deleteEnrollment(id);
    }
}