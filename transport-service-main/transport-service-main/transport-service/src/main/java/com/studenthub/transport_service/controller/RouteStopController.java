package com.studenthub.transport_service.controller;

import com.studenthub.transport_service.data.model.RouteStop;
import com.studenthub.transport_service.service.RouteStopService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/route-stops")
public class RouteStopController {

    private final RouteStopService service;

    public RouteStopController(RouteStopService service) {
        this.service = service;
    }

    @GetMapping("/route/{routeId}")
    public List<RouteStop> getStopsByRoute(@PathVariable Long routeId) {
        return service.getStopsByRoute(routeId);
    }

    @GetMapping("/{id}")
    public RouteStop getStopById(@PathVariable Long id) {
        return service.getStopById(id);
    }

    @PostMapping("/route/{routeId}")
    public RouteStop createStop(@PathVariable Long routeId,
                                @RequestBody RouteStop stop) {
        return service.createStop(routeId, stop);
    }

    @PutMapping("/{id}")
    public RouteStop updateStop(@PathVariable Long id,
                                @RequestBody RouteStop stop) {
        return service.updateStop(id, stop);
    }

    @DeleteMapping("/{id}")
    public void deleteStop(@PathVariable Long id) {
        service.deleteStop(id);
    }
}
