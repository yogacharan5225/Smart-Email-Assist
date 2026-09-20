const apiUrlInput = document.getElementById("api-url");
const saveUrlBtn = document.getElementById("save-url");
const urlStatus = document.getElementById("url-status");

const emailContentInput = document.getElementById("email-content");
const toneSelect = document.getElementById("tone");
const generateBtn = document.getElementById("generate");
const genStatus = document.getElementById("gen-status");
const resultWrap = document.getElementById("result-wrap");
const resultTextarea = document.getElementById("result");
const copyBtn = document.getElementById("copy");

async function loadApiUrl() {
  const { apiUrl } = await chrome.runtime.sendMessage({ type: "GET_API_URL" });
  apiUrlInput.value = apiUrl;
}

saveUrlBtn.addEventListener("click", async () => {
  const value = apiUrlInput.value.trim() || "http://localhost:8080";

  let originPattern;
  try {
    const url = new URL(value);
    originPattern = `${url.origin}/*`;
  } catch {
    urlStatus.textContent = "Enter a valid URL, e.g. http://localhost:8080";
    return;
  }

  // localhost:8080/127.0.0.1:8080 are pre-granted in manifest.json.
  // Any other backend origin (e.g. a deployed URL) needs the optional
  // host permission requested at runtime, per Manifest V3 rules.
  const alreadyGranted = await chrome.permissions.contains({ origins: [originPattern] });
  if (!alreadyGranted) {
    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) {
      urlStatus.textContent = "Permission denied for that origin — URL not saved.";
      return;
    }
  }

  await chrome.storage.sync.set({ apiUrl: value });
  urlStatus.textContent = "Saved.";
  setTimeout(() => (urlStatus.textContent = ""), 1500);
});

generateBtn.addEventListener("click", () => {
  const emailContent = emailContentInput.value.trim();
  if (!emailContent) {
    genStatus.textContent = "Please paste the email you're replying to.";
    genStatus.className = "hint";
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating…";
  genStatus.textContent = "";
  resultWrap.classList.add("hidden");

  chrome.runtime.sendMessage(
    {
      type: "GENERATE_REPLY",
      payload: { emailContent, tone: toneSelect.value },
    },
    (response) => {
      generateBtn.disabled = false;
      generateBtn.textContent = "Generate Reply";

      if (chrome.runtime.lastError) {
        genStatus.textContent = "Extension error. Please try again.";
        return;
      }

      if (!response || !response.ok) {
        genStatus.textContent = response?.error || "Failed to generate a reply.";
        return;
      }

      resultTextarea.value = response.reply;
      resultWrap.classList.remove("hidden");
      genStatus.textContent = "";
    }
  );
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(resultTextarea.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});

loadApiUrl();
