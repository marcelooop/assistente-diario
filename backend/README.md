# Back end

Spring Boot 4 · Java 17 · Maven · API REST.

## Rodar (desenvolvimento, H2 em memoria)

```bash
./mvnw spring-boot:run        # Windows: .\mvnw.cmd spring-boot:run
```

- Saude: http://localhost:8080/actuator/health
- Console H2: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:assistente`, usuario `sa`, sem senha)

## Producao (PostgreSQL)

```bash
SPRING_PROFILES_ACTIVE=prod DB_URL=jdbc:postgresql://host:5432/assistente DB_USER=... DB_PASSWORD=... ./mvnw spring-boot:run
```

## Testes

```bash
./mvnw test
```
