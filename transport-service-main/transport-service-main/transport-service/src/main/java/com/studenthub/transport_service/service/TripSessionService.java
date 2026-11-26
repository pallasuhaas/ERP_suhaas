package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.repository.StudentTripStatusRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.studenthub.transport_service.exception.ResourceNotFoundException;
import com.studenthub.transport_service.data.model.*;
import com.studenthub.transport_service.data.repository.TripSessionRepository;
import com.studenthub.transport_service.data.repository.TransportRouteRepository;
import com.studenthub.transport_service.data.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TripSessionService {

    private final TripSessionRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final TransportRouteRepository routeRepository;
    private final StudentTripStatusRepository tripStatusRepository;

    public TripSessionService(TripSessionRepository tripRepository,
                              VehicleRepository vehicleRepository,
                              TransportRouteRepository routeRepository,
                              StudentTripStatusRepository tripStatusRepository) {
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.routeRepository = routeRepository;
        this.tripStatusRepository = tripStatusRepository;
    }

    public List<TripSession> getAllTrips() {
        return tripRepository.findAll();
    }

    public TripSession getTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TripSession not found with id: " + id));
    }

    public List<TripSession> getTripsByVehicle(Long vehicleId) {
        return tripRepository.findByVehicleVehicleId(vehicleId);
    }

    public List<TripSession> getTripsByRoute(Long routeId) {
        return tripRepository.findByRouteRouteId(routeId);
    }

    public TripSession createTrip(Long vehicleId,
                                  Long routeId,
                                  TripSession trip) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        TransportRoute route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + routeId));

        trip.setVehicle(vehicle);
        trip.setRoute(route);

        validate(trip);
        return tripRepository.save(trip);
    }

    public TripSession updateTrip(Long id, TripSession updated) {
        TripSession existing = getTripById(id);

        existing.setTripDate(updated.getTripDate());
        existing.setTripType(updated.getTripType());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setStatus(updated.getStatus());

        validate(existing);
        return tripRepository.save(existing);
    }

    public void deleteTrip(Long id) {
        getTripById(id);
        blockIfUsed("Trip", java.util.Map.of("student trip status", tripStatusRepository.countByTripTripId(id)));
        tripRepository.deleteById(id);
    }

    // BUG-008b: cross-field / format rules that annotations can't express
    private void validate(TripSession x) {
        if (x.getStartTime() != null && x.getEndTime() != null && x.getEndTime().isBefore(x.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endTime must be after startTime.");
        }
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
