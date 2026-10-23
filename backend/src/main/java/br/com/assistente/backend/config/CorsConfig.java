package br.com.assistente.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    /** Origens permitidas (web Angular e Ionic em desenvolvimento). Sobrescreva com APP_CORS_ORIGENS. */
    @Bean
    WebMvcConfigurer corsConfigurer(
            @Value("${app.cors.origens:http://localhost:4200,http://localhost:8100}") String[] origens) {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(origens)
                        .allowedMethods("GET", "POST", "PUT", "DELETE");
            }
        };
    }
}
