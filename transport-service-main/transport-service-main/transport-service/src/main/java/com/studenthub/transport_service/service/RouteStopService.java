package com.studenthub.transport_service.service;

import com.studenthub.transport_service.data.model.RouteStop;
import com.studenthub.transport_service.data.model.TransportRoute;
import com.studenthub.transport_service.data.repository.RouteStopRepository;
import com.studenthub.transport_service.data.repository.TransportRouteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RouteStopService {

    private final RouteStopRepository stopRepository;
    private final TransportRouteRepository routeRepository;

    public RouteStopService(RouteStopRepository stopRepository,
                            TransportRouteRepository routeRepository) {
        this.stopRepository = stopRepository;
        this.routeRepository = routeRepository;
    }

    public List<RouteStop> getStopsByRoute(Long routeId) {
        return stopRepository.findByRouteRouteIdOrderBySequenceOrder(routeId);
    }

    public RouteStop getStopById(Long id) {
        return stopRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("RouteStop not found with id: " + id));
    }

    public RouteStop createStop(Long routeId, RouteStop stop) {
        TransportRoute route = routeRepository.findById(routeId)
                .orElseThrow(() -> new RuntimeException("TransportRoute not found with id: " + routeId));

        stop.setRoute(route);
        return stopRepository.save(stop);
    }

    public RouteStop updateStop(Long id, RouteStop updated) {
        RouteStop existing = getStopById(id);

        existing.setStopName(updated.getStopName());
        existing.setSequenceOrder(updated.getSequenceOrder());

        return stopRepository.save(existing);
    }

    public void deleteStop(Long id) {
        stopRepository.deleteById(id);
    }
}
