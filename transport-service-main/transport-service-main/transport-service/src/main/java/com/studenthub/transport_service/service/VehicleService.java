package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.repository.*;
import org.springframework.transaction.annotation.Transactional;
import com.studenthub.transport_service.exception.ResourceNotFoundException;
import com.studenthub.transport_service.data.model.*;
import com.studenthub.transport_service.data.repository.DriverRepository;
import com.studenthub.transport_service.data.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final TripSessionRepository tripRepository;
    private final StudentTransportAssignmentRepository assignmentRepository;
    private final VehicleTrackingRepository trackingRepository;
    private final TransportRouteRepository routeRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                          DriverRepository driverRepository,
                          TripSessionRepository tripRepository,
                          StudentTransportAssignmentRepository assignmentRepository,
                          VehicleTrackingRepository trackingRepository,
                          TransportRouteRepository routeRepository) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.tripRepository = tripRepository;
        this.assignmentRepository = assignmentRepository;
        this.trackingRepository = trackingRepository;
        this.routeRepository = routeRepository;
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
    }

    public Vehicle createVehicle(Long driverId, Vehicle vehicle) {

        Driver driver = null;
        if (driverId != null) {
            driver = driverRepository.findById(driverId)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));
        }

        vehicle.setDriver(driver);
        ensureRegistrationFree(vehicle, null);
        return vehicleRepository.save(vehicle);
    }

    public Vehicle updateVehicle(Long id, Vehicle updated) {
        Vehicle existing = getVehicleById(id);
        ensureRegistrationFree(updated, id);

        existing.setRegistrationNumber(updated.getRegistrationNumber());
        existing.setVehicleType(updated.getVehicleType());
        existing.setCapacity(updated.getCapacity());
        existing.setStatus(updated.getStatus());

        if (updated.getDriver() != null) {
            existing.setDriver(updated.getDriver());
        }

        return vehicleRepository.save(existing);
    }

    // BUG-009: clear 409 instead of a raw unique-constraint 500
    private void ensureRegistrationFree(Vehicle vehicle, Long ownId) {
        if (vehicle.getRegistrationNumber() == null) return;
        vehicle.setRegistrationNumber(vehicle.getRegistrationNumber().trim());
        vehicleRepository.findByRegistrationNumber(vehicle.getRegistrationNumber())
                .filter(other -> !other.getVehicleId().equals(ownId))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Vehicle registration '" + vehicle.getRegistrationNumber() + "' already exists.");
                });
    }

    public void deleteVehicle(Long id) {
        getVehicleById(id);
        java.util.Map<String, Long> users = new java.util.LinkedHashMap<>();
        users.put("route", routeRepository.countByVehicleVehicleId(id));
        users.put("student assignment", assignmentRepository.countByVehicleVehicleId(id));
        users.put("trip", tripRepository.countByVehicleVehicleId(id));
        users.put("tracking record", trackingRepository.countByVehicleVehicleId(id));
        blockIfUsed("Vehicle", users);
        vehicleRepository.deleteById(id);
    }

    // BUG-010: refuse a delete that would break references, and say what is in the way
    private static void blockIfUsed(String what, java.util.Map<String, Long> users) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        users.forEach((name, n) -> { if (n > 0) parts.add(n + " " + name + (n == 1 ? "" : "s")); });
        if (!parts.isEmpty()) {
            String list = parts.size() == 1 ? parts.get(0)
                    : String.join(", ", parts.subList(0, parts.size() - 1)) + " and " + parts.get(parts.size() - 1);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    what + " is still used by " + list + ". Remove or reassign them first.");
        }
    }
}
