package com.studenthub.transport_service.controller;

import jakarta.validation.Valid;
import com.studenthub.transport_service.data.model.TripSession;
import com.studenthub.transport_service.service.TripSessionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trip-sessions")
public class TripSessionController {

    private final TripSessionService service;

    public TripSessionController(TripSessionService service) {
        this.service = service;
    }

    @GetMapping
    public List<TripSession> getAllTrips() {
        return service.getAllTrips();
    }

    @GetMapping("/{id}")
    public TripSession getTripById(@PathVariable Long id) {
        return service.getTripById(id);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<TripSession> getTripsByVehicle(@PathVariable Long vehicleId) {
        return service.getTripsByVehicle(vehicleId);
    }

    @GetMapping("/route/{routeId}")
    public List<TripSession> getTripsByRoute(@PathVariable Long routeId) {
        return service.getTripsByRoute(routeId);
    }

    @PostMapping
    public TripSession createTrip(@RequestParam Long vehicleId,
                                  @RequestParam Long routeId,
                                  @Valid @RequestBody TripSession trip) {
        return service.createTrip(vehicleId, routeId, trip);
    }

    @PutMapping("/{id}")
    public TripSession updateTrip(@PathVariable Long id,
                                  @Valid @RequestBody TripSession trip) {
        return service.updateTrip(id, trip);
    }

    @DeleteMapping("/{id}")
    public void deleteTrip(@PathVariable Long id) {
        service.deleteTrip(id);
    }
}
