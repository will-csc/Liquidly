# Backend API Structure (Java Spring Boot)

This document explains the package organization within `backend-api/src/main/java/com/liquidly/api`.

## `controller`
- **What it is:** The API entry point (Control Layer).
- **Importance:** Receives HTTP requests (GET, POST, PUT, DELETE) from the frontend, calls the appropriate `service`, and returns the response (JSON). It defines your API URLs.
- **Example:** `UserController.java` (defines `/api/users`), `ProjectController.java`.

## `service`
- **What it is:** The business logic (The "brain" of the system).
- **Importance:** Contains the system rules. This is where you validate data, perform calculations, and decide what to do before saving to the database. The Controller calls the Service.
- **Example:** `UserService.java` (rule to create user), `ProjectService.java`.

## `repository`
- **What it is:** Database access (Data Layer).
- **Importance:** Interfaces that communicate directly with PostgreSQL. They use JPA/Hibernate to perform SQL queries automatically without you needing to write SQL manually for everything.
- **Example:** `UserRepository.java`, `ProjectRepository.java`.

## `model`
- **What it is:** The database entities.
- **Importance:** Java classes that represent your SQL database tables. Each attribute of the class becomes a column in the table.
- **Example:** `User.java` (`users` table), `Project.java` (`projects` table).

## `dto` (Data Transfer Object)
- **What it is:** Objects for data transfer.
- **Importance:** Defines what data enters and leaves the API. Used to hide sensitive data (like passwords) when sending responses to the frontend, or to receive specific data in forms.
- **Example:** `UserDTO.java` (returns user without password).

## `exception`
- **What it is:** Centralized error handling.
- **Importance:** Captures errors that happen anywhere in the system and transforms them into friendly messages for the frontend, preventing the API from "breaking" or showing ugly errors.
- **Example:** `GlobalExceptionHandler.java`.
