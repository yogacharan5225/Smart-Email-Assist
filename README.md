# Smart Email Assist

AI-powered email reply generator built with **Spring Boot, Spring AI, Google Gemini, React, and Material UI**.

> The Chrome Extension is intentionally not part of the current implementation yet. It will be added after the core web application is stable and tested.

## Architecture

```text
React + Material UI
        |
        | POST /api/email/generate
        v
Spring Boot REST API
        |
        v
Spring AI ChatClient
        |
        v
Google Gemini Developer API
        |
        v
Generated email reply
```

## Features

- Generate context-aware email replies from original email content
- Selectable reply tones: professional, friendly, casual, formal, concise
- Spring AI `ChatClient` integration with Google Gemini
- Backend-only Gemini API key handling
- React UI with loading, validation and error states
- One-click reply copying
- Environment-based configuration

## Tech Stack

### Backend
- Java 21
- Spring Boot 4.0.1
- Spring AI 2.0.0
- Google Gemini Developer API
- Maven

### Frontend
- React 19
- Vite
- Material UI
- Axios

## Local Setup

### 1. Backend

Copy `email-writer-sb/.env.example` to `email-writer-sb/.env` and set your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.4
CORS_ALLOWED_ORIGINS=*
```

Run from `email-writer-sb`:

```bash
cd email-writer-sb
./mvnw spring-boot:run
```

Windows:

```bat
mvnw.cmd spring-boot:run
```

The API starts on `http://localhost:8080` by default.

### 2. Frontend

```bash
cd email-writer-react
npm install
npm run dev
```

Optional `email-writer-react/.env`:

```env
VITE_API_URL=http://localhost:8080
```

## API

### POST `/api/email/generate`

Request:

```json
{
  "emailContent": "Could you please send the project report by Friday?",
  "tone": "professional"
}
```

Response:

```text
Certainly. I will send the project report by Friday. Thank you.
```

## Security

- Never commit `.env` or API keys.
- The Gemini key is used only by the Spring Boot backend.
- The React application communicates with the backend rather than calling Gemini directly.

## Roadmap

- [x] Spring Boot REST API
- [x] React email reply UI
- [x] Gemini integration
- [x] Spring AI ChatClient integration
- [x] Input validation and API error handling
- [ ] Chrome Manifest V3 extension
- [ ] Gmail reply-box integration
- [ ] End-to-end extension testing
