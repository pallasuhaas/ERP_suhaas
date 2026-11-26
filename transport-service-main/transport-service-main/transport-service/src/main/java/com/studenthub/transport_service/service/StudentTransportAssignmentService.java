package com.studenthub.transport_service.service;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.transport_service.exception.ResourceNotFoundException;
import com.studenthub.transport_service.data.model.*;
import com.studenthub.transport_service.data.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentTransportAssignmentService {

    private final StudentTransportAssignmentRepository assignmentRepository;
    private final TransportRouteRepository routeRepository;
    private final VehicleRepository vehicleRepository;

    public StudentTransportAssignmentService(StudentTransportAssignmentRepository assignmentRepository,
                                             TransportRouteRepository routeRepository,
                                             VehicleRepository vehicleRepository) {
        this.assignmentRepository = assignmentRepository;
        this.routeRepository = routeRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<StudentTransportAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public StudentTransportAssignment getAssignmentById(Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
    }

    public List<StudentTransportAssignment> getAssignmentsByStudent(Long studentId) {
        return assignmentRepository.findByStudentId(studentId);
    }

    public StudentTransportAssignment createAssignment(Long studentId,
                                                       Long routeId,
                                                       Long vehicleId,
                                                       StudentTransportAssignment assignment) {

        TransportRoute route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        assignment.setStudentId(studentId);
        assignment.setRoute(route);
        assignment.setVehicle(vehicle);

        validate(assignment);
        return assignmentRepository.save(assignment);
    }

    public StudentTransportAssignment updateAssignment(Long id, StudentTransportAssignment updated) {
        StudentTransportAssignment existing = getAssignmentById(id);

        existing.setPickupPoint(updated.getPickupPoint());
        existing.setDropPoint(updated.getDropPoint());
        existing.setEffectiveFrom(updated.getEffectiveFrom());
        existing.setEffectiveTo(updated.getEffectiveTo());

        validate(existing);
        return assignmentRepository.save(existing);
    }

    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }

    // BUG-008b: cross-field / format rules that annotations can't express
    private void validate(StudentTransportAssignment x) {
        if (x.getEffectiveFrom() != null && x.getEffectiveTo() != null && x.getEffectiveTo().isBefore(x.getEffectiveFrom())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "effectiveTo must be on or after effectiveFrom.");
        }
    }
}
