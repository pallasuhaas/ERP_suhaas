-- =========================================================
-- SchoolHub ERP — Official Database Schema
-- Source: TS-SQL Schema for School Hub Data Model (PDF)
-- Database: school_hub
-- Compatible: MySQL 8 / AWS Aurora MySQL
-- =========================================================

USE school_hub;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- STUDENT INFORMATION MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS student (
    student_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name        VARCHAR(100)  NOT NULL,
    last_name         VARCHAR(100)  NOT NULL,
    date_of_birth     DATE          NOT NULL,
    gender            VARCHAR(20)   NOT NULL,
    admission_number  VARCHAR(50)   NOT NULL UNIQUE,
    admission_date    DATE          NOT NULL,
    grade_level       VARCHAR(50)   NOT NULL,
    section           VARCHAR(50)   NULL,
    status            ENUM('ACTIVE','INACTIVE','TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
    created_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at        DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS contact_info (
    contact_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT        NOT NULL,
    email           VARCHAR(150)  NOT NULL,
    phone           VARCHAR(50)   NOT NULL,
    alternate_phone VARCHAR(50)   NULL,
    CONSTRAINT fk_contact_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS guardian (
    guardian_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT        NOT NULL,
    full_name    VARCHAR(150)  NOT NULL,
    relationship VARCHAR(50)   NOT NULL,
    phone        VARCHAR(50)   NOT NULL,
    email        VARCHAR(150)  NULL,
    CONSTRAINT fk_guardian_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS address (
    address_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id   BIGINT        NOT NULL,
    address_type ENUM('HOME','HOSTEL','GUARDIAN') NOT NULL,
    street       VARCHAR(255)  NOT NULL,
    city         VARCHAR(100)  NOT NULL,
    state        VARCHAR(100)  NOT NULL,
    postal_code  VARCHAR(20)   NOT NULL,
    country      VARCHAR(100)  NOT NULL,
    CONSTRAINT fk_address_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS enrollment (
    enrollment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id    BIGINT       NOT NULL,
    academic_year VARCHAR(20)  NOT NULL,
    grade_level   VARCHAR(50)  NOT NULL,
    section       VARCHAR(50)  NOT NULL,
    start_date    DATE         NOT NULL,
    end_date      DATE         NULL,
    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS user_account (
    user_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id    BIGINT        NULL,
    username      VARCHAR(100)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('STUDENT','PARENT','ADMIN') NOT NULL,
    enabled       TINYINT(1)    NOT NULL DEFAULT 1,
    CONSTRAINT fk_user_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS student_profile_snapshot (
    snapshot_id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id            BIGINT  NOT NULL,
    snapshot_date         DATE    NOT NULL,
    attendance_rate       DOUBLE  NULL,
    fee_compliance_score  DOUBLE  NULL,
    transport_usage_score DOUBLE  NULL,
    predictive_risk_score DOUBLE  NULL,
    CONSTRAINT fk_snapshot_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- PAYMENT MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS fee_structure (
    fee_structure_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    academic_year    VARCHAR(20)  NOT NULL,
    grade_level      VARCHAR(50)  NOT NULL,
    fee_type         ENUM('TUITION','TRANSPORT','LAB','OTHER') NOT NULL,
    amount           DOUBLE       NOT NULL,
    due_date         DATE         NOT NULL,
    recurring        TINYINT(1)   NOT NULL DEFAULT 0
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS discount_policy (
    discount_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    criteria            ENUM('SIBLING','MERIT','STAFF_CHILD','OTHER') NOT NULL,
    discount_percentage DOUBLE       NOT NULL,
    valid_from          DATE         NOT NULL,
    valid_to            DATE         NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS fee_invoice (
    invoice_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id       BIGINT  NOT NULL,
    fee_structure_id BIGINT  NOT NULL,
    discount_id      BIGINT  NULL,
    invoice_date     DATE    NOT NULL,
    due_date         DATE    NOT NULL,
    total_amount     DOUBLE  NOT NULL,
    status           ENUM('PAID','UNPAID','PARTIAL') NOT NULL DEFAULT 'UNPAID',
    discount_applied DOUBLE  NULL,
    CONSTRAINT fk_invoice_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_invoice_fee_structure
        FOREIGN KEY (fee_structure_id) REFERENCES fee_structure(fee_structure_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_invoice_discount
        FOREIGN KEY (discount_id) REFERENCES discount_policy(discount_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS payment_transaction (
    transaction_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id       BIGINT        NOT NULL,
    payment_date     DATE          NOT NULL,
    payment_mode     ENUM('CARD','BANK_TRANSFER','UPI','CASH','OTHER') NOT NULL,
    amount_paid      DOUBLE        NOT NULL,
    reference_number VARCHAR(100)  NULL,
    status           ENUM('SUCCESS','FAILURE','PENDING') NOT NULL,
    CONSTRAINT fk_transaction_invoice
        FOREIGN KEY (invoice_id) REFERENCES fee_invoice(invoice_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- TRANSPORTATION MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS driver (
    driver_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name         VARCHAR(150) NOT NULL,
    license_number    VARCHAR(100) NOT NULL UNIQUE,
    contact_number    VARCHAR(50)  NOT NULL,
    employment_status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS vehicle (
    vehicle_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id           BIGINT       NULL,
    registration_number VARCHAR(50)  NOT NULL UNIQUE,
    vehicle_type        ENUM('BUS','VAN','OTHER') NOT NULL,
    capacity            INT          NOT NULL,
    status              ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_vehicle_driver
        FOREIGN KEY (driver_id) REFERENCES driver(driver_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS transport_route (
    route_id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_name             VARCHAR(150) NOT NULL,
    start_point            VARCHAR(150) NOT NULL,
    end_point              VARCHAR(150) NOT NULL,
    distance_km            DOUBLE       NULL,
    estimated_time_minutes INT          NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS route_stop (
    stop_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id       BIGINT       NOT NULL,
    stop_name      VARCHAR(150) NOT NULL,
    sequence_order INT          NOT NULL,
    CONSTRAINT fk_stop_route
        FOREIGN KEY (route_id) REFERENCES transport_route(route_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS student_transport_assignment (
    assignment_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id     BIGINT       NOT NULL,
    route_id       BIGINT       NOT NULL,
    vehicle_id     BIGINT       NOT NULL,
    pickup_point   VARCHAR(150) NOT NULL,
    drop_point     VARCHAR(150) NOT NULL,
    effective_from DATE         NOT NULL,
    effective_to   DATE         NULL,
    CONSTRAINT fk_assignment_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assignment_route
        FOREIGN KEY (route_id) REFERENCES transport_route(route_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_assignment_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS trip_session (
    trip_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT       NOT NULL,
    route_id   BIGINT       NOT NULL,
    trip_date  DATE         NOT NULL,
    trip_type  ENUM('PICKUP','DROPOFF') NOT NULL,
    start_time DATETIME(6)  NULL,
    end_time   DATETIME(6)  NULL,
    status     ENUM('SCHEDULED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT fk_trip_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_trip_route
        FOREIGN KEY (route_id) REFERENCES transport_route(route_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS vehicle_tracking (
    tracking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id  BIGINT      NOT NULL,
    timestamp   DATETIME(6) NOT NULL,
    latitude    DOUBLE      NOT NULL,
    longitude   DOUBLE      NOT NULL,
    trip_type   ENUM('PICKUP','DROPOFF') NOT NULL,
    status      ENUM('EN_ROUTE','ARRIVED','DELAYED') NOT NULL,
    CONSTRAINT fk_tracking_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_tracking_vehicle_time (vehicle_id, timestamp)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS student_trip_status (
    status_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id     BIGINT      NOT NULL,
    trip_id        BIGINT      NOT NULL,
    pickup_status  ENUM('PENDING','PICKED_UP','MISSED')   NOT NULL DEFAULT 'PENDING',
    dropoff_status ENUM('PENDING','DROPPED_OFF','MISSED') NOT NULL DEFAULT 'PENDING',
    pickup_time    DATETIME(6) NULL,
    dropoff_time   DATETIME(6) NULL,
    CONSTRAINT fk_trip_status_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_trip_status_trip
        FOREIGN KEY (trip_id) REFERENCES trip_session(trip_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- =========================================================
-- NOTIFICATION / VISIBILITY MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS notification (
    notification_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id        BIGINT       NULL,
    user_id           BIGINT       NULL,
    message           VARCHAR(500) NOT NULL,
    trigger_type      ENUM('GPS_UPDATE','ARRIVAL_ALERT','DELAY_ALERT','OTHER') NOT NULL,
    recipient_type    ENUM('PARENT','ADMIN','STUDENT') NOT NULL,
    location_snapshot JSON         NULL,
    status            ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
    sent_at           DATETIME(6)  NULL,
    CONSTRAINT fk_notification_student
        FOREIGN KEY (student_id) REFERENCES student(student_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES user_account(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================
-- 16 tables created across 4 microservices
-- student-info-service (8091): student, contact_info, guardian, address,
--                               enrollment, user_account, student_profile_snapshot
-- payment-service      (8092): fee_structure, discount_policy, fee_invoice,
--                               payment_transaction
-- transport-service    (8093): driver, vehicle, transport_route, route_stop,
--                               student_transport_assignment, trip_session,
--                               vehicle_tracking, student_trip_status
-- notification-service (8094): notification
-- =========================================================
