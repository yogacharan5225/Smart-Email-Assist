package com.email.writer.app;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * REST API for AI email reply generation.
 * <p>
 * CORS is configured centrally in {@link com.email.writer.config.WebConfig}
 * (allowed origins are environment-driven), so no per-controller
 * {@code @CrossOrigin} annotation is used here.
 */
@RestController
@RequestMapping("/api/email")
@AllArgsConstructor
@Slf4j
public class EmailGeneratorController {

    private final EmailGeneratorService emailGeneratorService;

    @PostMapping("/generate")
    public ResponseEntity<String> generateEmail(@Valid @RequestBody EmailRequest emailRequest) {
        return ResponseEntity.ok(emailGeneratorService.generateEmailReply(emailRequest));
    }

    /**
     * Triggered by {@code @Valid} failures on {@link EmailRequest}
     * (e.g. blank email content, tone too long). Previously unhandled,
     * so it fell through to Spring Boot's default error page instead
     * of a clean JSON response.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationError(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fieldError ->
                fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage()));

        String message = fieldErrors.isEmpty()
                ? "Invalid request."
                : String.join(" ", fieldErrors.values());

        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleGenerationError(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", ex.getMessage()));
    }

    /**
     * Last-resort fallback so unexpected exceptions never leak a stack
     * trace or internal detail to the client.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpectedError(Exception ex) {
        log.error("Unexpected error while generating email reply", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Something went wrong while generating the reply. Please try again."));
    }
}
