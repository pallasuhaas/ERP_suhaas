package com.studenthub.student_info_service.service;

import com.studenthub.student_info_service.data.model.Student;
import com.studenthub.student_info_service.data.model.StudentProfileSnapshot;
import com.studenthub.student_info_service.data.repository.StudentProfileSnapshotRepository;
import com.studenthub.student_info_service.data.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentProfileSnapshotService {

    private final StudentProfileSnapshotRepository snapshotRepository;
    private final StudentRepository studentRepository;

    public StudentProfileSnapshotService(StudentProfileSnapshotRepository snapshotRepository,
                                         StudentRepository studentRepository) {
        this.snapshotRepository = snapshotRepository;
        this.studentRepository = studentRepository;
    }

    public List<StudentProfileSnapshot> getSnapshotsByStudent(Long studentId) {
        return snapshotRepository.findByStudentStudentId(studentId);
    }

    public StudentProfileSnapshot getSnapshotById(Long id) {
        return snapshotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Snapshot not found with id: " + id));
    }

    public StudentProfileSnapshot createSnapshot(Long studentId, StudentProfileSnapshot snapshot) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        snapshot.setStudent(student);
        return snapshotRepository.save(snapshot);
    }

    public StudentProfileSnapshot updateSnapshot(Long id, StudentProfileSnapshot updated) {
        StudentProfileSnapshot existing = getSnapshotById(id);

        existing.setSnapshotDate(updated.getSnapshotDate());
        existing.setAttendanceRate(updated.getAttendanceRate());
        existing.setFeeComplianceScore(updated.getFeeComplianceScore());
        existing.setTransportUsageScore(updated.getTransportUsageScore());
        existing.setPredictiveRiskScore(updated.getPredictiveRiskScore());

        return snapshotRepository.save(existing);
    }

    public void deleteSnapshot(Long id) {
        snapshotRepository.deleteById(id);
    }
}