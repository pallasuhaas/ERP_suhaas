package com.studenthub.student_info_service.service;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.student_info_service.exception.ResourceNotFoundException;
import com.studenthub.student_info_service.data.model.Enrollment;
import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.repository.EnrollmentRepository;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             StudentRepository studentRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
    }

    public List<Enrollment> getEnrollmentsByStudent(Long studentId) {
        return enrollmentRepository.findByStudentStudentId(studentId);
    }

    public Enrollment getEnrollmentById(Long id) {
        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found with id: " + id));
    }

    public Enrollment createEnrollment(Long studentId, Enrollment enrollment) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        enrollment.setStudent(student);
        validate(enrollment);
        return enrollmentRepository.save(enrollment);
    }

    public Enrollment updateEnrollment(Long id, Enrollment updated) {
        Enrollment existing = getEnrollmentById(id);

        existing.setAcademicYear(updated.getAcademicYear());
        existing.setGradeLevel(updated.getGradeLevel());
        existing.setSection(updated.getSection());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());

        validate(existing);
        return enrollmentRepository.save(existing);
    }

    public void deleteEnrollment(Long id) {
        enrollmentRepository.deleteById(id);
    }

    // BUG-008b: cross-field / format rules that annotations can't express
    private void validate(Enrollment x) {
        if (x.getStartDate() != null && x.getEndDate() != null && x.getEndDate().isBefore(x.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate must be on or after startDate.");
        }
    }
}
