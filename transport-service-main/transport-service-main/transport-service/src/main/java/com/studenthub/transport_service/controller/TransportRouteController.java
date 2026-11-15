package com.studenthub.transport_service.controller;

import com.studenthub.transport_service.data.model.TransportRoute;
import com.studenthub.transport_service.service.TransportRouteService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport-routes")
public class TransportRouteController {

    private final TransportRouteService service;

    public TransportRouteController(TransportRouteService service) {
        this.service = service;
    }

    @GetMapping
    public List<TransportRoute> getAllRoutes() {
        return service.getAllRoutes();
    }

    @GetMapping("/{id}")
    public TransportRoute getRouteById(@PathVariable Long id) {
        return service.getRouteById(id);
    }

    @PostMapping
    public TransportRoute createRoute(@RequestBody TransportRoute route) {
        return service.createRoute(route);
    }

    @PutMapping("/{id}")
    public TransportRoute updateRoute(@PathVariable Long id,
                                      @RequestBody TransportRoute route) {
        return service.updateRoute(id, route);
    }

    @DeleteMapping("/{id}")
    public void deleteRoute(@PathVariable Long id) {
        service.deleteRoute(id);
    }
}
