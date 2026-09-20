# Build the React interface first.
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY email-writer-react/package.json email-writer-react/package-lock.json ./
RUN npm ci
COPY email-writer-react/ ./
RUN npm run build

# Copy the resulting static files into Spring Boot before packaging the API.
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY email-writer-sb/ ./
COPY --from=frontend-build /app/dist ./src/main/resources/static
RUN mvn -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend-build /app/target/email-writer-sb-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
CMD ["sh", "-c", "java -jar app.jar"]
