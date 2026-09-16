package com.email.writer.app;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EmailRequest {

    @NotBlank(message = "Email content is required.")
    @Size(max = 20000, message = "Email content is too long.")
    private String emailContent;

    @Size(max = 50, message = "Tone is too long.")
    private String tone;
}
