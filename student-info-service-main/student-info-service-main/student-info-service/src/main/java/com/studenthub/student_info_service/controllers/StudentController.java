package com.studenthub.student_info_service.controllers;

import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.model.StudentStatus;
import com.studenthub.student_info_service.dto.BulkUploadResponse;
import com.studenthub.student_info_service.service.StudentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return service.getAllStudents();
    }

    @GetMapping("/archived")
    public List<Student> getArchived() {
        return service.getArchivedStudents();
    }

    @GetMapping("/{id}")
    public Student getStudent(@PathVariable Long id) {
        return service.getStudentById(id);
    }

    @PostMapping
    public Student createStudent(@RequestBody Student student) {
        return service.createStudent(student);
    }

    @PostMapping("/bulk")
    public BulkUploadResponse bulkCreateStudents(@RequestBody List<Student> students) {
        return service.bulkCreate(students);
    }

    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable Long id, @RequestBody Student student) {
        return service.updateStudent(id, student);
    }

    @PatchMapping("/{id}/status")
    public Student updateStatus(@PathVariable Long id, @RequestParam StudentStatus status) {
        return service.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteStudent(@PathVariable Long id) {
        service.deleteStudent(id);
    }
}
