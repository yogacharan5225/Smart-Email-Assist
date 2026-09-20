// content.js — runs inside mail.google.com.
//
// Gmail does not expose a public API for its DOM, so this relies on
// selectors that have been stable for a long time in Gmail's web UI but
// are NOT officially documented and CAN change if Google ships a redesign:
//   - `div[aria-label="Message Body"][contenteditable="true"]` -> the
//     reply/compose editor
//   - `.a3s.aiL` -> rendered body of a message in the thread view
// If Gmail changes these, the injected button will simply stop appearing;
// nothing else on the page breaks, and the popup fallback still works.

const PROCESSED_ATTR = "data-sea-processed";
const TONE_OPTIONS = ["professional", "friendly", "casual", "formal", "concise"];

function getLatestEmailText() {
  const bodies = Array.from(document.querySelectorAll(".a3s.aiL"));
  for (let i = bodies.length - 1; i >= 0; i -= 1) {
    const text = bodies[i].innerText.trim();
    if (text) return text;
  }
  return "";
}

function findComposeToolbarContainer(editableBox) {
  // Walk up from the editable body to the compose panel that also
  // contains the Send button, so we can anchor our UI to something
  // that's guaranteed to be visible alongside the box the user is
  // typing into.
  let node = editableBox;
  for (let depth = 0; depth < 8 && node; depth += 1) {
    if (node.querySelector && node.querySelector('[aria-label^="Send"], [data-tooltip^="Send"]')) {
      return node;
    }
    node = node.parentElement;
  }
  return editableBox.parentElement;
}

function createPanel() {
  const panel = document.createElement("div");
  panel.className = "sea-panel";

  const select = document.createElement("select");
  select.className = "sea-tone-select";
  TONE_OPTIONS.forEach((tone) => {
    const opt = document.createElement("option");
    opt.value = tone;
    opt.textContent = tone.charAt(0).toUpperCase() + tone.slice(1);
    select.appendChild(opt);
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "sea-generate-btn";
  button.textContent = "✨ AI Reply";

  const status = document.createElement("span");
  status.className = "sea-status";

  panel.appendChild(select);
  panel.appendChild(button);
  panel.appendChild(status);

  return { panel, select, button, status };
}

function insertTextIntoEditable(editableBox, text) {
  editableBox.focus();

  // Place the cursor at the very start of the compose box so the AI
  // reply is inserted above any quoted thread text Gmail has already
  // pre-filled, rather than in the middle of it.
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editableBox);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // execCommand is deprecated for general use but remains the most
  // reliable way to insert text into a contenteditable such that
  // Gmail's own React-driven state (character count, Send button
  // enablement, draft autosave) picks up the change, since it fires the
  // same native input events Gmail listens for.
  const inserted = document.execCommand("insertText", false, `${text}\n\n`);

  if (!inserted) {
    // Fallback for browsers/contexts where execCommand silently no-ops.
    editableBox.textContent = `${text}\n\n${editableBox.textContent || ""}`;
    editableBox.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
}

function attachPanel(editableBox) {
  if (editableBox.getAttribute(PROCESSED_ATTR) === "true") return;
  editableBox.setAttribute(PROCESSED_ATTR, "true");

  const anchor = findComposeToolbarContainer(editableBox);
  if (!anchor) return;

  const { panel, select, button, status } = createPanel();
  anchor.insertAdjacentElement("beforebegin", panel);

  button.addEventListener("click", async () => {
    const emailContent = getLatestEmailText();

    if (!emailContent) {
      status.textContent = "Couldn't find the original email text on this page.";
      status.className = "sea-status sea-status-error";
      return;
    }

    button.disabled = true;
    button.textContent = "Generating…";
    status.textContent = "";
    status.className = "sea-status";

    chrome.runtime.sendMessage(
      {
        type: "GENERATE_REPLY",
        payload: { emailContent, tone: select.value },
      },
      (response) => {
        button.disabled = false;
        button.textContent = "✨ AI Reply";

        if (chrome.runtime.lastError) {
          status.textContent = "Extension error. Try reloading the Gmail tab.";
          status.className = "sea-status sea-status-error";
          return;
        }

        if (!response || !response.ok) {
          status.textContent = response?.error || "Failed to generate a reply.";
          status.className = "sea-status sea-status-error";
          return;
        }

        insertTextIntoEditable(editableBox, response.reply);
        status.textContent = "Reply inserted.";
        status.className = "sea-status sea-status-success";
      }
    );
  });
}

function scanForComposeBoxes() {
  document
    .querySelectorAll('div[aria-label="Message Body"][contenteditable="true"]')
    .forEach(attachPanel);
}

const observer = new MutationObserver(() => scanForComposeBoxes());
observer.observe(document.body, { childList: true, subtree: true });

// Initial pass in case a compose box is already open when the script loads.
scanForComposeBoxes();
