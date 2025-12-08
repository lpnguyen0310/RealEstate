# ----- BUILD STAGE -----
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# copy file cấu hình Maven trước để cache dependency
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw

# tải dependency (tùy chọn, để build nhanh hơn)
RUN ./mvnw -q -B dependency:go-offline

# copy source và build jar
COPY src ./src
RUN ./mvnw -q -B package -DskipTests

# ----- RUN STAGE -----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# copy file jar đã build sang stage run
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
