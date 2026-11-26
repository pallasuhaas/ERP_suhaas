package com.studenthub.student_info_service.service;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.student_info_service.exception.ResourceNotFoundException;
import com.studenthub.student_info_service.data.model.Guardian;
import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.repository.GuardianRepository;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuardianService {

    private final GuardianRepository guardianRepository;
    private final StudentRepository studentRepository;

    public GuardianService(GuardianRepository guardianRepository,
                           StudentRepository studentRepository) {
        this.guardianRepository = guardianRepository;
        this.studentRepository = studentRepository;
    }

    public List<Guardian> getGuardiansByStudent(Long studentId) {
        return guardianRepository.findByStudentStudentId(studentId);
    }

    public Guardian getGuardianById(Long id) {
        return guardianRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guardian not found with id: " + id));
    }

    public Guardian createGuardian(Long studentId, Guardian guardian) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        guardian.setStudent(student);
        validate(guardian);
        return guardianRepository.save(guardian);
    }

    public Guardian updateGuardian(Long id, Guardian updated) {
        Guardian existing = getGuardianById(id);

        existing.setFullName(updated.getFullName());
        existing.setRelationship(updated.getRelationship());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());

        validate(existing);
        return guardianRepository.save(existing);
    }

    public void deleteGuardian(Long id) {
        guardianRepository.deleteById(id);
    }

    // BUG-008b: cross-field / format rules that annotations can't express
    private void validate(Guardian x) {
        // store phones as plain digits so parent-portal lookup by phone matches
        if (x.getPhone() != null) x.setPhone(x.getPhone().replaceAll("[\\s-]", ""));
        if (x.getPhone() != null && !x.getPhone().isEmpty() && !x.getPhone().matches("\\d{10}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone must be 10 digits.");
        }
    }
}
