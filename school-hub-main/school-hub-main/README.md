# school-hub
A management platform for handling all school management related activities

## School Hub – Local Development Setup  
This guide explains how to set up MySQL locally, create the required database schemas, and run all Spring Boot microservices (Student Info, Payment, Student Transportation, Student Notification) locally.

1. Install MySQL on Windows 11

 MySQL Installer (recommended)
1. Download MySQL Installer (Community Edition):  
   https://dev.mysql.com/downloads/installer/
2. Install:
   - MySQL Server
   - MySQL Workbench
3. Configure:
   - Root password  
   - Port: 3306
   - Enable “Start MySQL as Windows Service”


2. Create Local Databases

Open MySQL Workbench or CLI and run the following command to create a database named school_hub:

CREATE DATABASE school_hub;

Then Import all the microservice individual database tables by running each 'CREATE TABLE' under the school_hub database from the following link one-by-one:

https://aispireheights.atlassian.net/wiki/spaces/TS/pages/34144257/SQL+Schema+for+School+Hub+Data+Model

This ensures that all the individual database tables are created in the school-hub database.


3. Configure Each Microservice to Use Local MySQL

Inside each microservice’s `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/school_hub
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```

4. Assign Unique Ports to Each Microservice

 Student Info Service
```properties
server.port=8091
```

 Student Payment Service
```properties
server.port=8092
```

 Student Transportation Service
```properties
server.port=8093
```

 Student Notification Service
```properties
server.port=8094
```

5. Configure Inter‑Service Communication

Use REST URLs for cross‑service calls.

 Example: Transportation Service → Student Info Service
```properties
student.service.url=http://localhost:8091/api/students
```

6. Run Each Microservice Locally

Using IntelliJ / VS Code:

1. Open each microservice as a separate project.
2. Run the Spring Boot main class.
3. Verify:
   - MySQL connection successful
   - Application started on correct port
   - No bean or dependency errors

Test endpoints:

```
http://localhost:8091/api/students
http://localhost:8093/api/vehicles
http://localhost:8094/api/notifications
```
