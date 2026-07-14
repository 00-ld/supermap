FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /workspace/backend

COPY backend/pom.xml .
COPY backend/src ./src

RUN mvn -q -DskipTests package

FROM eclipse-temurin:21.0.7_6-jre-jammy

WORKDIR /app

COPY --from=build /workspace/backend/target/chemical-backend-1.0.0.jar app.jar
COPY deploy/backend/application-docker.yml /app/config/application-docker.yml

# 以非特权用户运行，避免容器内 root 提权风险
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
