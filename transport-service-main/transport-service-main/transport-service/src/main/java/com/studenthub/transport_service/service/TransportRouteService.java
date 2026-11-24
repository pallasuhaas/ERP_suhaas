package com.studenthub.transport_service.service;

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

    public TransportRouteService(TransportRouteRepository repository,
                                 VehicleRepository vehicleRepository) {
        this.repository = repository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<TransportRoute> getAllRoutes() {
        return repository.findAll();
    }

    public TransportRoute getRouteById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TransportRoute not found with id: " + id));
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
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));
    }

    public void deleteRoute(Long id) {
        repository.deleteById(id);
    }
}
