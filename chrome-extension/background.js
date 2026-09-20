// background.js — MV3 service worker.
//
// Why the fetch lives here instead of in content.js:
// content scripts run "inside" the Gmail page and can be constrained by
// Gmail's own Content-Security-Policy for network requests. The service
// worker is a separate extension context with its own permissions
// (declared in manifest.json host_permissions), so routing the API call
// through it is the reliable way to reach an arbitrary backend origin.

const DEFAULT_API_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 30000;

async function getApiUrl() {
  const stored = await chrome.storage.sync.get("apiUrl");
  return (stored.apiUrl && stored.apiUrl.trim()) || DEFAULT_API_URL;
}

async function generateReply({ emailContent, tone }) {
  const apiUrl = await getApiUrl();
  const endpoint = `${apiUrl.replace(/\/+$/, "")}/api/email/generate`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailContent, tone }),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    const parsed = contentType.includes("application/json") && raw
      ? safeJsonParse(raw)
      : raw;

    if (!response.ok) {
      const message =
        (parsed && typeof parsed === "object" && parsed.error) ||
        `Backend returned ${response.status}.`;
      return { ok: false, error: message };
    }

    const reply = typeof parsed === "string" ? parsed : (parsed && parsed.reply) || raw;
    return { ok: true, reply };
  } catch (err) {
    const message =
      err.name === "AbortError"
        ? "Request to the backend timed out. Is it running?"
        : `Could not reach the backend at ${apiUrl}. Is it running and is the URL correct in the extension popup?`;
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GENERATE_REPLY") {
    generateReply(message.payload).then(sendResponse);
    return true; // keep the message channel open for the async response
  }

  if (message?.type === "GET_API_URL") {
    getApiUrl().then((apiUrl) => sendResponse({ apiUrl }));
    return true;
  }

  return false;
});
