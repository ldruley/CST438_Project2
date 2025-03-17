# syntax=docker/dockerfile:1

# Stage 1: Build the application
FROM gradle:8.5-jdk21 AS build

# Set the working directory
WORKDIR /app

# Copy only the necessary files for dependency resolution
COPY build.gradle settings.gradle /app/
COPY src /app/src

# Build the application
RUN gradle wrapper --gradle-version 8.5
RUN gradle build --no-daemon

# Stage 2: Create the runtime image
FROM openjdk:21-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the built application from the build stage
COPY --from=build /app/build/libs/app.jar /app/app.jar

# Expose the application port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]