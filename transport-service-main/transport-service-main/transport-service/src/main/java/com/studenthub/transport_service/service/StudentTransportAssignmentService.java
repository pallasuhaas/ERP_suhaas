package com.studenthub.transport_service.service;

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
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));
    }

    public List<StudentTransportAssignment> getAssignmentsByStudent(Long studentId) {
        return assignmentRepository.findByStudentId(studentId);
    }

    public StudentTransportAssignment createAssignment(Long studentId,
                                                       Long routeId,
                                                       Long vehicleId,
                                                       StudentTransportAssignment assignment) {

        TransportRoute route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + routeId));

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        assignment.setStudentId(studentId);
        assignment.setRoute(route);
        assignment.setVehicle(vehicle);

        return assignmentRepository.save(assignment);
    }

    public StudentTransportAssignment updateAssignment(Long id, StudentTransportAssignment updated) {
        StudentTransportAssignment existing = getAssignmentById(id);

        existing.setPickupPoint(updated.getPickupPoint());
        existing.setDropPoint(updated.getDropPoint());
        existing.setEffectiveFrom(updated.getEffectiveFrom());
        existing.setEffectiveTo(updated.getEffectiveTo());

        return assignmentRepository.save(existing);
    }

    public void deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
    }
}
