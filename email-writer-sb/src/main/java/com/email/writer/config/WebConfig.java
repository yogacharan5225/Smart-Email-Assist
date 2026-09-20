package com.email.writer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Central CORS configuration.
 * <p>
 * Allowed origins come from the {@code CORS_ALLOWED_ORIGINS} environment
 * variable as a comma-separated list, e.g.
 * {@code CORS_ALLOWED_ORIGINS=http://localhost:5173,https://myapp.example.com}.
 * <p>
 * Defaults to {@code *} (any origin), which is what the React dev server
 * and the Chrome extension (each of which get a unique, unpredictable
 * {@code chrome-extension://<id>} origin) both need out of the box.
 * No credentials/cookies are used by this API, so a wildcard origin does
 * not expose session data. Tighten {@code CORS_ALLOWED_ORIGINS} for a
 * production deployment where the caller's origin is known ahead of time.
 */
@Configuration
public class WebConfig {

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        if (origins.contains("*")) {
            configuration.addAllowedOriginPattern("*");
        } else {
            configuration.setAllowedOrigins(origins);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    /**
     * This project has no Spring Security on the classpath, so a bare
     * {@link CorsConfigurationSource} bean is never consulted by Spring MVC
     * on its own — it has to be wired into a {@link CorsFilter} (or a
     * {@code WebMvcConfigurer#addCorsMappings}) to actually take effect.
     */
    @Bean
    public CorsFilter corsFilter(CorsConfigurationSource corsConfigurationSource) {
        return new CorsFilter(corsConfigurationSource);
    }
}
