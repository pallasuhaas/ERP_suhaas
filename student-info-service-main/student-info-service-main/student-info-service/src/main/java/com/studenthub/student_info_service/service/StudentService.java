package com.studenthub.student_info_service.service;

import com.studenthub.student_info_service.exception.ResourceNotFoundException;
import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.model.StudentStatus;
import com.studenthub.student_info_service.client.CrossServiceRecords;
import com.studenthub.student_info_service.data.repository.*;
import org.springframework.transaction.annotation.Transactional;
import com.studenthub.student_info_service.dto.BulkUploadResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {

    private final StudentRepository repository;
    private final GuardianRepository guardianRepository;
    private final AddressRepository addressRepository;
    private final ContactInfoRepository contactInfoRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentProfileSnapshotRepository snapshotRepository;
    private final UserAccountRepository userAccountRepository;
    private final CrossServiceRecords crossServiceRecords;

    public StudentService(StudentRepository repository,
                          GuardianRepository guardianRepository,
                          AddressRepository addressRepository,
                          ContactInfoRepository contactInfoRepository,
                          EnrollmentRepository enrollmentRepository,
                          StudentProfileSnapshotRepository snapshotRepository,
                          UserAccountRepository userAccountRepository,
                          CrossServiceRecords crossServiceRecords) {
        this.repository = repository;
        this.guardianRepository = guardianRepository;
        this.addressRepository = addressRepository;
        this.contactInfoRepository = contactInfoRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.snapshotRepository = snapshotRepository;
        this.userAccountRepository = userAccountRepository;
        this.crossServiceRecords = crossServiceRecords;
    }

    public List<Student> getAllStudents() {
        return repository.findAll();
    }

    public Student getStudentById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

    public Student createStudent(Student student) {
        ensureAdmissionNumberFree(student, null);
        return repository.save(student);
    }

    // BUG-009: clear 409 instead of a raw unique-constraint 500
    private void ensureAdmissionNumberFree(Student student, Long ownId) {
        if (student.getAdmissionNumber() == null) return;
        student.setAdmissionNumber(student.getAdmissionNumber().trim());
        repository.findByAdmissionNumber(student.getAdmissionNumber())
                .filter(other -> !other.getStudentId().equals(ownId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Admission number '" + student.getAdmissionNumber() + "' already exists.");
                });
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
            } catch (DataIntegrityViolationException | jakarta.validation.ConstraintViolationException e) {
                // duplicate, or a row that breaks a validation rule (e.g. future DOB): skip it, keep the rest
                skipped.add(admissionNumber);
            }
        }
        return new BulkUploadResponse(saved.size(), skipped.size(), saved, skipped);
    }

    public Student updateStudent(Long id, Student updated) {
        Student existing = getStudentById(id);
        ensureAdmissionNumberFree(updated, id);

        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setDateOfBirth(updated.getDateOfBirth());
        existing.setGender(updated.getGender());
        existing.setAdmissionNumber(updated.getAdmissionNumber());
        existing.setAdmissionDate(updated.getAdmissionDate());
        existing.setGradeLevel(updated.getGradeLevel());
        existing.setSection(updated.getSection());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());

        return repository.save(existing);
    }

    public Student updateStatus(Long id, StudentStatus status) {
        Student s = getStudentById(id);
        s.setStatus(status);
        return repository.save(s);
    }

    public List<Student> getArchivedStudents() {
        return repository.findByStatus(StudentStatus.ARCHIVED);
    }

    /**
     * BUG-010 soft delete.
     * - Active student  -> archived (nothing is removed, other services keep valid references). Returns "ARCHIVED".
     * - Archived student -> removed for good, together with its guardians/addresses/contacts/enrollments/snapshots/
     *   user account, but only if payment/transport/notification hold no records for it (409 otherwise). Returns "DELETED".
     */
    @Transactional
    public String deleteStudent(Long id) {
        Student student = getStudentById(id);
        if (student.getStatus() != StudentStatus.ARCHIVED) {
            student.setStatus(StudentStatus.ARCHIVED);
            repository.save(student);
            return "ARCHIVED";
        }
        List<String> parts = new ArrayList<>();
        crossServiceRecords.countFor(id).forEach((kind, n) -> { if (n > 0) parts.add(n + " " + kind + (n == 1 ? "" : "s")); });
        if (!parts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Student still has " + String.join(", ", parts)
                    + " in other services, so they stay archived. Remove those records first to delete permanently.");
        }
        guardianRepository.deleteByStudentStudentId(id);
        addressRepository.deleteByStudentStudentId(id);
        contactInfoRepository.deleteByStudentStudentId(id);
        enrollmentRepository.deleteByStudentStudentId(id);
        snapshotRepository.deleteByStudentStudentId(id);
        userAccountRepository.findByStudentStudentId(id).ifPresent(userAccountRepository::delete);
        repository.delete(student);
        return "DELETED";
    }
}