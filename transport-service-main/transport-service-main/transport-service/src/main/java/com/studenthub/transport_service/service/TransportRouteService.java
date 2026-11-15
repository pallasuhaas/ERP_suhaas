package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.model.TransportRoute;
import com.studenthub.transport_service.data.repository.TransportRouteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransportRouteService {

    private final TransportRouteRepository repository;

    public TransportRouteService(TransportRouteRepository repository) {
        this.repository = repository;
    }

    public List<TransportRoute> getAllRoutes() {
        return repository.findAll();
    }

    public TransportRoute getRouteById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("TransportRoute not found with id: " + id));
    }

    public TransportRoute createRoute(TransportRoute route) {
        return repository.save(route);
    }

    public TransportRoute updateRoute(Long id, TransportRoute updated) {
        TransportRoute existing = getRouteById(id);

        existing.setRouteName(updated.getRouteName());
        existing.setStartPoint(updated.getStartPoint());
        existing.setEndPoint(updated.getEndPoint());
        existing.setDistanceKm(updated.getDistanceKm());
        existing.setEstimatedTimeMinutes(updated.getEstimatedTimeMinutes());

        return repository.save(existing);
    }

    public void deleteRoute(Long id) {
        repository.deleteById(id);
    }
}
