package com.studenthub.student_info_service.service;

import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import com.studenthub.student_info_service.dto.BulkUploadResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {

    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    public List<Student> getAllStudents() {
        return repository.findAll();
    }

    public Student getStudentById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }

    public Student createStudent(Student student) {
        return repository.save(student);
    }

    // Saves each student independently; rows whose admissionNumber already exists
    // (in the DB or earlier in the same upload) or that fail to persist are skipped.
    public BulkUploadResponse bulkCreate(List<Student> students) {
        List<Student> saved = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (Student student : students) {
            String admissionNumber = student.getAdmissionNumber();
            if (admissionNumber == null || admissionNumber.isBlank()
                    || !seen.add(admissionNumber)
                    || repository.findByAdmissionNumber(admissionNumber).isPresent()) {
                skipped.add(admissionNumber);
                continue;
            }
            try {
                saved.add(repository.save(student));
            } catch (DataIntegrityViolationException e) {
                skipped.add(admissionNumber);
            }
        }
        return new BulkUploadResponse(saved.size(), skipped.size(), saved, skipped);
    }

    public Student updateStudent(Long id, Student updated) {
        Student existing = getStudentById(id);

        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setDateOfBirth(updated.getDateOfBirth());
        existing.setGender(updated.getGender());
        existing.setAdmissionNumber(updated.getAdmissionNumber());
        existing.setAdmissionDate(updated.getAdmissionDate());
        existing.setGradeLevel(updated.getGradeLevel());
        existing.setSection(updated.getSection());
        existing.setStatus(updated.getStatus());

        return repository.save(existing);
    }

    public void deleteStudent(Long id) {
        repository.deleteById(id);
    }
}