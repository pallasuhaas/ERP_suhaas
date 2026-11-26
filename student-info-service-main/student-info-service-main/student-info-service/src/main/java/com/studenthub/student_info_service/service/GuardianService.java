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

    // BUG-017: parent-portal login. Phones are stored as 10 plain digits (see validate()), so the input is
    // normalised the same way: "98450 01122", "98450-01122" and "+91 9845001122" all match 9845001122.
    public List<Guardian> getGuardiansByPhone(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("91")) digits = digits.substring(2);
        if (digits.isEmpty()) return List.of();
        return guardianRepository.findByPhone(digits);
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
