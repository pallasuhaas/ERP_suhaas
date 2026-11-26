package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.repository.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.transport_service.exception.ResourceNotFoundException;
import com.studenthub.transport_service.data.model.TransportRoute;
import com.studenthub.transport_service.data.model.Vehicle;
import com.studenthub.transport_service.data.repository.TransportRouteRepository;
import com.studenthub.transport_service.data.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransportRouteService {

    private final TransportRouteRepository repository;
    private final VehicleRepository vehicleRepository;
    private final RouteStopRepository stopRepository;
    private final StudentTransportAssignmentRepository assignmentRepository;
    private final TripSessionRepository tripRepository;

    public TransportRouteService(TransportRouteRepository repository,
                                 VehicleRepository vehicleRepository,
                                 RouteStopRepository stopRepository,
                                 StudentTransportAssignmentRepository assignmentRepository,
                                 TripSessionRepository tripRepository) {
        this.repository = repository;
        this.vehicleRepository = vehicleRepository;
        this.stopRepository = stopRepository;
        this.assignmentRepository = assignmentRepository;
        this.tripRepository = tripRepository;
    }

    public List<TransportRoute> getAllRoutes() {
        return repository.findAll();
    }

    public TransportRoute getRouteById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TransportRoute not found with id: " + id));
    }

    public TransportRoute createRoute(TransportRoute route, Long vehicleId) {
        if (vehicleId != null) {
            route.setVehicle(findVehicle(vehicleId));
        }
        return repository.save(route);
    }

    public TransportRoute updateRoute(Long id, TransportRoute updated, Long vehicleId) {
        TransportRoute existing = getRouteById(id);

        existing.setRouteName(updated.getRouteName());
        existing.setStartPoint(updated.getStartPoint());
        existing.setEndPoint(updated.getEndPoint());
        existing.setDistanceKm(updated.getDistanceKm());
        existing.setEstimatedTimeMinutes(updated.getEstimatedTimeMinutes());
        if (vehicleId != null) {
            existing.setVehicle(findVehicle(vehicleId));
        }

        return repository.save(existing);
    }

    private Vehicle findVehicle(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));
    }

    // Stops belong to the route, so they go with it; assignments and trips block the delete.
    @Transactional
    public void deleteRoute(Long id) {
        getRouteById(id);
        java.util.Map<String, Long> users = new java.util.LinkedHashMap<>();
        users.put("student assignment", assignmentRepository.countByRouteRouteId(id));
        users.put("trip", tripRepository.countByRouteRouteId(id));
        blockIfUsed("Route", users);
        stopRepository.deleteByRouteRouteId(id);
        repository.deleteById(id);
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
