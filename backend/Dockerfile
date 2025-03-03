FROM gradle:jdk21

COPY . .

RUN chmod +x ./gradlew
RUN ./gradlew assemble --no-daemon

# Set the command to run the application
ENTRYPOINT ["java", "-jar", "build/libs/*.jar"]