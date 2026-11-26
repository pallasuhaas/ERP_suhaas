package com.studenthub.transport_service.data.repository;

import com.studenthub.transport_service.data.model.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {

    List<RouteStop> findByRouteRouteIdOrderBySequenceOrder(Long routeId);
    void deleteByRouteRouteId(Long routeId);
}
