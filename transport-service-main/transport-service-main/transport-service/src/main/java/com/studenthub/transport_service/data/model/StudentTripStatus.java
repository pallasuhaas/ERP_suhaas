package com.studenthub.transport_service.data.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_trip_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentTripStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "status_id")
    private Long statusId;

    @Column(name = "student_id", nullable = false)
    private Long studentId; // referenced via REST call, not JPA relation

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private TripSession trip;

    @Enumerated(EnumType.STRING)
    @Column(name = "pickup_status", nullable = false, length = 20)
    @NotNull
    private PickupStatus pickupStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "dropoff_status", nullable = false, length = 20)
    @NotNull
    private DropoffStatus dropoffStatus;

    @Column(name = "pickup_time")
    private LocalDateTime pickupTime;

    @Column(name = "dropoff_time")
    private LocalDateTime dropoffTime;
}
