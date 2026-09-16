package com.email.writer.app;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailGeneratorService {

    private final ChatClient chatClient;

    public EmailGeneratorService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        if (emailRequest == null || !StringUtils.hasText(emailRequest.getEmailContent())) {
            throw new IllegalArgumentException("Email content is required.");
        }

        String prompt = buildPrompt(emailRequest);

        try {
            String response = chatClient.prompt()
                    .system("You are an expert professional email assistant. Generate concise, natural and context-aware email replies.")
                    .user(prompt)
                    .call()
                    .content();

            if (!StringUtils.hasText(response)) {
                throw new IllegalStateException("Gemini returned an empty response.");
            }

            return response.trim();
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate the email reply. Check the Gemini API configuration and try again.", ex);
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {
        String tone = StringUtils.hasText(emailRequest.getTone())
                ? emailRequest.getTone().trim()
                : "professional";

        return """
                Generate a reply to the email below.

                Requirements:
                - Use a %s tone.
                - Do not generate a subject line.
                - Reply directly to the sender.
                - Keep the response clear, natural and concise.
                - Do not mention that you are an AI.
                - Do not invent facts that are not present in the original email.

                Original email:
                ---
                %s
                ---
                """.formatted(tone, emailRequest.getEmailContent().trim());
    }
}
