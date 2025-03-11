FROM gradle:jdk21 as build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew bootJar --no-daemon

FROM openjdk:21-slim
WORKDIR /app
COPY --from=build /app/build/libs/app.jar .

# Heroku uses the CMD to start the application
CMD ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]