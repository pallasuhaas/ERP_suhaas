# **AWS Cloud Deployment Architecture – School Hub ERP Microservices**

This document describes how to deploy all backend microservices (Student Info, Student Transportation, Student Notification, etc.) to AWS using a **domain‑driven microservices architecture** with **ECS Fargate**, **API Gateway**, **Cognito**, **VPC**, and **centralized logging/monitoring**.



#  **1. Core Architecture Style**

### **Microservices Pattern**
- Domain‑driven microservices (Student Info, Transportation, Notification, Payments, etc.)
- Each service deployed independently
- REST communication between services
- Event‑driven patterns for:
    - Transport tracking (GPS updates)
    - Notifications
    - Payments
    - Analytics

### **Deployment Model**
- Containerized Spring Boot microservices
- Deployed on **AWS ECS Fargate** (serverless containers)
- Centralized configuration, logging, and monitoring



# **2. AWS Platform Components**

## **2.1 Compute Layer – ECS Fargate**
Each microservice runs as:
- **Docker image** stored in Amazon ECR
- **ECS Task Definition** (CPU/memory, environment variables, IAM role)
- **ECS Service** (auto‑scaling, health checks)
- **Fargate launch type** (no EC2 servers to manage)

Benefits:
- Fully managed compute
- Auto‑scaling per microservice
- Secure by default (runs inside VPC)



## **2.2 Networking – Amazon VPC**

### **VPC Structure**
- **Private subnets** → ECS Fargate tasks (microservices)
- **Public subnets** → API Gateway / ALB
- **NAT Gateway** → Allows private services to call external APIs
- **Security Groups**:
    - API Gateway/ALB → allow inbound HTTPS
    - ECS tasks → allow inbound only from ALB/API Gateway
    - RDS → allow inbound only from ECS tasks

### **Routing**
- API Gateway → ALB → ECS Services
- Internal service‑to‑service calls via private VPC DNS



## **2.3 API Gateway – Entry Point for All Clients**

### **Amazon API Gateway (HTTP APIs)**
- Single unified entry point for:
    - Students
    - Parents
    - Admins
    - Mobile apps
    - Web apps
- Routes requests to:
    - ALB → ECS microservices
    - Lambda (optional for async tasks)
    - EventBridge (optional for events)

### **Features**
- JWT validation (Cognito)
- Rate limiting
- Request/response transformation
- CORS configuration



## **2.4 Authentication & Authorization**

### **Amazon Cognito**
Used for:
- Student login
- Parent login
- Admin login
- Optional SSO (Google, Microsoft)

### **API Authentication**
- API Gateway validates JWT tokens
- Passes claims to backend microservices
- Spring Security validates roles/permissions

### **IAM Roles**
- ECS Task Roles → allow microservices to access:
    - S3
    - SNS/SQS
    - EventBridge
    - Secrets Manager
    - CloudWatch Logs
- Principle of least privilege



# **3. Data Layer**

### **Amazon RDS (MySQL or Aurora MySQL)**
- Each microservice has its own schema (recommended)
- Private subnet only
- Encrypted at rest (KMS)
- Automated backups

### **Secrets Manager**
Stores:
- DB credentials
- API keys
- Sensitive config

Microservices load secrets at runtime via ECS Task Role.



# **4. Deployment Workflow**

## **Step 1 — Build Docker Images**
From each microservice root:

```bash
./mvnw clean package
docker build -t student-info-service .
docker build -t student-transport-service .
docker build -t student-notification-service .
```

## **Step 2 — Push Images to Amazon ECR**
```bash
aws ecr create-repository --repository-name student-info-service
aws ecr get-login-password | docker login --username AWS --password-stdin <ECR_URL>

docker tag student-info-service:latest <ECR_URL>/student-info-service:latest
docker push <ECR_URL>/student-info-service:latest
```

Repeat for all microservices.



## **Step 3 — Create ECS Fargate Services**
For each microservice:

1. Create **Task Definition**
    - Container image from ECR
    - CPU/memory
    - Environment variables
    - Secrets from Secrets Manager
    - IAM Task Role

2. Create **ECS Service**
    - Launch type: Fargate
    - Desired count: 1–3
    - Auto‑scaling enabled
    - Attach to private subnets
    - Attach security group



## **Step 4 — Create Application Load Balancer (ALB)**
- Public subnets
- HTTPS listener (ACM certificate)
- Target groups for each microservice
- Health checks: `/actuator/health`



## **Step 5 — Configure API Gateway**
### **Routes**
```
/students/* → ALB → Student Info Service
/transport/* → ALB → Transportation Service
/notifications/* → ALB → Notification Service
```

### **Security**
- Enable JWT authorizer (Cognito)
- Validate tokens before forwarding to ALB



## **Step 6 — Configure Logging & Monitoring**

### **CloudWatch Logs**
- ECS task logs
- API Gateway logs
- ALB access logs

### **CloudWatch Metrics**
- CPU/memory per microservice
- API latency
- Error rates

### **X-Ray (optional)**
- Distributed tracing across microservices



# **5. Event‑Driven Components (Optional but Recommended)**

### **Amazon EventBridge**
- GPS tracking events
- Payment events
- Notification triggers

### **Amazon SNS/SQS**
- Asynchronous communication
- Retry handling
- Decoupled microservices



# **6. Security Best Practices**

- Use **IAM Task Roles**, not hardcoded credentials
- Store secrets in **AWS Secrets Manager**
- Use **HTTPS everywhere**
- Restrict RDS access to ECS security group only
- Enable **WAF** on API Gateway (optional)
- Enable **encryption at rest** (KMS)



# **7. Summary of AWS Components Used**

| Component >> Purpose |

| **ECS Fargate** >> Run microservices without servers |

| **ECR** >> Store Docker images |

| **API Gateway** >> Public API entry point |

| **Cognito** >> Authentication & JWT issuance |

| **ALB** >> Routing to ECS services |

| **VPC** >> Secure networking |

| **RDS MySQL** >> Database layer |

| **Secrets Manager** >> Secure config storage |

| **CloudWatch** >> Logs & monitoring |

| **EventBridge/SNS/SQS** >> Event-driven workflows |



