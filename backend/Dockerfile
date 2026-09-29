# Stage 1: Build the backend with Maven and Eclipse Temurin JDK 17
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image with Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre
WORKDIR /app

# Ensure SQLite data directory exists
RUN mkdir -p /app/data

# Copy built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose application port
EXPOSE 8085

# Launch Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
