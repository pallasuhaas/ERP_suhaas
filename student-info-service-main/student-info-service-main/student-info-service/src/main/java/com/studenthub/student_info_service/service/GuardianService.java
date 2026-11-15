package com.studenthub.student_info_service.service;

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
                .orElseThrow(() -> new RuntimeException("Guardian not found with id: " + id));
    }

    public Guardian createGuardian(Long studentId, Guardian guardian) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        guardian.setStudent(student);
        return guardianRepository.save(guardian);
    }

    public Guardian updateGuardian(Long id, Guardian updated) {
        Guardian existing = getGuardianById(id);

        existing.setFullName(updated.getFullName());
        existing.setRelationship(updated.getRelationship());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());

        return guardianRepository.save(existing);
    }

    public void deleteGuardian(Long id) {
        guardianRepository.deleteById(id);
    }
}