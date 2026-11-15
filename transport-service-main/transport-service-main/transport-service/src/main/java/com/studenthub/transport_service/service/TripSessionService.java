package com.studenthub.transport_service.service;

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

    public TripSessionService(TripSessionRepository tripRepository,
                              VehicleRepository vehicleRepository,
                              TransportRouteRepository routeRepository) {
        this.tripRepository = tripRepository;
        this.vehicleRepository = vehicleRepository;
        this.routeRepository = routeRepository;
    }

    public List<TripSession> getAllTrips() {
        return tripRepository.findAll();
    }

    public TripSession getTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TripSession not found with id: " + id));
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
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        TransportRoute route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + routeId));

        trip.setVehicle(vehicle);
        trip.setRoute(route);

        return tripRepository.save(trip);
    }

    public TripSession updateTrip(Long id, TripSession updated) {
        TripSession existing = getTripById(id);

        existing.setTripDate(updated.getTripDate());
        existing.setTripType(updated.getTripType());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setStatus(updated.getStatus());

        return tripRepository.save(existing);
    }

    public void deleteTrip(Long id) {
        tripRepository.deleteById(id);
    }
}
