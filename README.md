# Smart Email Assist

Smart Email Assist generates tone-selected email replies through a Spring Boot
backend. It includes a React web app and a Manifest V3 Chrome extension for
use in Gmail.

## Architecture

```text
React web app or Gmail Chrome extension
                |
                v
     Spring Boot REST API
                |
                v
       Reply-generation service
```

Both clients call `POST /api/email/generate`. Credentials stay on the backend;
the browser app and extension never receive them.

## Project layout

```text
email-writer-sb/      Spring Boot backend
email-writer-react/   React web app
chrome-extension/     Manifest V3 Chrome extension for Gmail
```

## Local setup

### Backend

```bash
cd email-writer-sb
cp .env.example .env
# Set GEMINI_API_KEY in .env
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd spring-boot:run`. The backend listens on port 8080
unless `PORT` is set.

### React web app

```bash
cd email-writer-react
npm install
npm run dev
```

### Chrome extension

1. Start the backend.
2. Open `chrome://extensions`, enable Developer mode, and choose Load unpacked.
3. Select `chrome-extension/`.
4. Open Gmail, click Reply, choose a tone, and use the AI Reply control.

## API

`POST /api/email/generate`

```json
{
  "emailContent": "Could you please send the project report by Friday?",
  "tone": "professional"
}
```

The endpoint returns generated reply text. Invalid input returns `400`;
upstream generation failures return `502`.

## Deployment and security

- Never commit `.env` files or credentials.
- Add `GEMINI_API_KEY` in your hosting platform's environment-variable or
  secret-management settings.
- Configure `CORS_ALLOWED_ORIGINS` to your deployed frontend URL and extension
  origin when applicable.
- Deploy the backend first, then configure the React app and extension with
  its public HTTPS URL.

## Validation still required

Run the backend and frontend locally, then load the extension in Chrome and
test a complete Gmail reply flow before presenting the project.
