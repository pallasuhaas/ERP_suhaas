package com.studenthub.transport_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tracking_id")
    private Long trackingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "timestamp", nullable = false)
    @NotNull
    private LocalDateTime timestamp;

    @Column(name = "latitude", nullable = false)
    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "trip_type", nullable = false, length = 20)
    @NotNull
    private TripType tripType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull
    private TrackingStatus status;
}
