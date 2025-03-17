# Running the Project with Docker

This project is configured to run using Docker and Docker Compose. Follow the steps below to set up and run the application.

## Requirements

- Docker version 20.10 or higher
- Docker Compose version 1.29 or higher

## Environment Variables

Ensure the following environment variables are set in the respective `.env` files:

- **Backend** (`./backend/.env`):
  - `DATABASE_URL`: Connection string for the database
- **Frontend** (`./frontend/CST438_Project2/.env`):
  - `API_URL`: URL of the backend API

## Build and Run Instructions

1. Clone the repository and navigate to the project root directory.
2. Build and start the services using Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   - Backend: `http://localhost:8080`
   - Frontend: `http://localhost:3000`

## Exposed Ports

- **Backend**: 8080
- **Frontend**: 3000
- **Database**: 5432

## Special Configuration

- The backend service depends on the database service and will wait for it to be ready before starting.
- The frontend service requires the backend API URL to be correctly set in its environment variables.

For further details, refer to the respective service directories and their configuration files.