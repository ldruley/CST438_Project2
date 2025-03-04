FROM gradle:jdk21
WORKDIR /app

COPY build/libs/*.jar app.jar
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew assemble --no-daemon

# Set the command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]