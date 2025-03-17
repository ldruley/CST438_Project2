FROM gradle:jdk21 as build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew bootJar --no-daemon

FROM openjdk:21-slim
WORKDIR /app
COPY --from=build /app/build/libs/app.jar .

# For local Docker and Heroku
EXPOSE 8080

# Heroku uses the CMD to start the application
# Use a shell form of CMD to allow environment variable substitution
CMD java -jar app.jar