package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.model.*;
import com.studenthub.transport_service.data.repository.StudentTripStatusRepository;
import com.studenthub.transport_service.data.repository.TripSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentTripStatusService {

    private final StudentTripStatusRepository statusRepository;
    private final TripSessionRepository tripRepository;

    public StudentTripStatusService(StudentTripStatusRepository statusRepository,
                                    TripSessionRepository tripRepository) {
        this.statusRepository = statusRepository;
        this.tripRepository = tripRepository;
    }

    public List<StudentTripStatus> getAllStatuses() {
        return statusRepository.findAll();
    }

    public StudentTripStatus getStatusById(Long id) {
        return statusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("StudentTripStatus not found with id: " + id));
    }

    public List<StudentTripStatus> getStatusesByStudent(Long studentId) {
        return statusRepository.findByStudentId(studentId);
    }

    public List<StudentTripStatus> getStatusesByTrip(Long tripId) {
        return statusRepository.findByTripTripId(tripId);
    }

    public StudentTripStatus createStatus(Long studentId,
                                          Long tripId,
                                          StudentTripStatus status) {

        TripSession trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("TripSession not found with id: " + tripId));

        status.setStudentId(studentId);
        status.setTrip(trip);

        return statusRepository.save(status);
    }

    public StudentTripStatus updateStatus(Long id, StudentTripStatus updated) {
        StudentTripStatus existing = getStatusById(id);

        existing.setPickupStatus(updated.getPickupStatus());
        existing.setDropoffStatus(updated.getDropoffStatus());
        existing.setPickupTime(updated.getPickupTime());
        existing.setDropoffTime(updated.getDropoffTime());

        return statusRepository.save(existing);
    }

    public void deleteStatus(Long id) {
        statusRepository.deleteById(id);
    }
}
