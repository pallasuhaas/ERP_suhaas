package com.studenthub.student_info_service.controllers;

import jakarta.validation.Valid;
import com.studenthub.student_info_service.data.model.StudentProfileSnapshot;
import com.studenthub.student_info_service.service.StudentProfileSnapshotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-profile-snapshots")
public class StudentProfileSnapshotController {

    private final StudentProfileSnapshotService service;

    public StudentProfileSnapshotController(StudentProfileSnapshotService service) {
        this.service = service;
    }

    @GetMapping("/student/{studentId}")
    public List<StudentProfileSnapshot> getSnapshotsByStudent(@PathVariable Long studentId) {
        return service.getSnapshotsByStudent(studentId);
    }

    @GetMapping("/{id}")
    public StudentProfileSnapshot getSnapshotById(@PathVariable Long id) {
        return service.getSnapshotById(id);
    }

    @PostMapping("/student/{studentId}")
    public StudentProfileSnapshot createSnapshot(@PathVariable Long studentId,
                                                 @Valid @RequestBody StudentProfileSnapshot snapshot) {
        return service.createSnapshot(studentId, snapshot);
    }

    @PutMapping("/{id}")
    public StudentProfileSnapshot updateSnapshot(@PathVariable Long id,
                                                 @Valid @RequestBody StudentProfileSnapshot snapshot) {
        return service.updateSnapshot(id, snapshot);
    }

    @DeleteMapping("/{id}")
    public void deleteSnapshot(@PathVariable Long id) {
        service.deleteSnapshot(id);
    }
}