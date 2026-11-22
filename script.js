const $ = id => document.getElementById(id);
const STORAGE_KEY = "passwordRecords";
const HIDDEN = "••••••••";

const commonPasswords = [
  "password", "password1", "123456", "12345678", "123456789",
  "qwerty", "abc123", "letmein", "admin", "welcome",
  "iloveyou", "monkey", "111111", "dragon", "football"
];

const levelLabels = { "weak": "Weak", "medium": "Medium", "strong": "Strong", "very-strong": "Very Strong" };

const rules = [
  ["ruleLength", p => p.length >= 8, "The password is too short. Use at least 8 characters."],
  ["ruleUpper", p => /[A-Z]/.test(p), "Add a capital letter."],
  ["ruleLower", p => /[a-z]/.test(p), "Add a small letter."],
  ["ruleNumber", p => /[0-9]/.test(p), "Add at least one number."],
  ["ruleSpecial", p => /[^A-Za-z0-9]/.test(p), "Add a special character like @ or #."]
];


let toastTimer;
function showToast(message, isError) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.toggle("error", !!isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function copyText(text, btn) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
  }
  btn.textContent = "Copied";
  showToast("Copied to clipboard", false);
  setTimeout(() => (btn.textContent = "Copy"), 1500);
}

function makeButton(text, onClick, className) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = text;
  if (className) btn.className = className;
  btn.addEventListener("click", () => onClick(btn));
  return btn;
}


$("toggleBtn").addEventListener("click", () => {
  const input = $("passwordInput");
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  $("toggleBtn").textContent = hidden ? "Hide" : "Show";
});

$("analyzerCopyBtn").addEventListener("click", () => {
  if ($("passwordInput").value === "") return showToast("Type a password first.", true);
  copyText($("passwordInput").value, $("analyzerCopyBtn"));
});

function hasSequence(password) {
  const lower = password.toLowerCase();
  const sequences = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiopasdfghjklzxcvbnm"];
  for (let i = 0; i <= lower.length - 4; i++) {
    const piece = lower.substring(i, i + 4);
    if (sequences.some(s => s.includes(piece))) return true;
  }
  return false;
}

function showWarnings(messages) {
  const list = $("warningsList");
  list.innerHTML = "";
  messages.forEach(message => {
    const li = document.createElement("li");
    li.textContent = message;
    list.appendChild(li);
  });
}

function estimateCrackTime(password) {
  const pool = (/[a-z]/.test(password) * 26) + (/[A-Z]/.test(password) * 26) +
               (/[0-9]/.test(password) * 10) + (/[^A-Za-z0-9]/.test(password) * 32);
  let time = Math.pow(pool, password.length) / 10000000000 / 2;

  if (time < 1) return "Instantly";

  const steps = [["second", 60], ["minute", 60], ["hour", 24], ["day", 365], ["year", 100]];
  for (const [unit, size] of steps) {
    if (time < size) {
      const rounded = Math.round(time);
      return rounded + " " + unit + (rounded === 1 ? "" : "s");
    }
    time /= size;
  }
  return "Centuries";
}

function checkStrength() {
  const password = $("passwordInput").value;
  const empty = password === "";

  const passed = rules.map(([id, test]) => {
    const ok = !empty && test(password);
    $(id).classList.toggle("met", ok);
    return ok;
  });

  if (empty) {
    $("strengthText").textContent = "None";
    $("strengthText").className = "";
    $("strengthBar").className = "";
    $("crackTime").textContent = "-";
    return showWarnings(["Type a password to see tips."]);
  }

  const score = passed.filter(Boolean).length;
  const warnings = rules.filter((rule, i) => !passed[i]).map(rule => rule[2]);

  const isCommon = commonPasswords.includes(password.toLowerCase());
  if (isCommon) warnings.push("This password is too common. Pick something less predictable.");
  if (/(.)\1\1/.test(password)) warnings.push("Do not repeat the same character three times in a row.");
  if (hasSequence(password)) warnings.push("Avoid easy patterns like 1234 or abcd.");

  const reused = getRecords().find(record => record.password === password);
  if (reused) warnings.push("You already use this password for " + reused.site + ". Never reuse passwords.");

  let level = score >= 5 ? "strong" : score >= 3 ? "medium" : "weak";
  if (isCommon || reused) {
    level = "weak";
  } else if (level === "strong") {
    level = warnings.length > 0 ? "medium" : password.length >= 12 ? "very-strong" : "strong";
  }

  $("strengthText").textContent = levelLabels[level];
  $("strengthText").className = level;
  $("strengthBar").className = level;
  $("crackTime").textContent = isCommon ? "Instantly" : estimateCrackTime(password);
  showWarnings(warnings.length === 0 ? ["Nice, no problems found."] : warnings);
}

$("passwordInput").addEventListener("input", checkStrength);


function randomNumber(max) {
  return window.crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

const randomChar = characters => characters.charAt(randomNumber(characters.length));

function getLength(step = 0) {
  let value = parseInt($("lengthInput").value, 10);
  if (isNaN(value)) value = 12;
  value = Math.min(32, Math.max(6, value + step));
  $("lengthInput").value = value;
  return value;
}

function generatePassword() {
  const length = getLength();
  const sets = ["abcdefghijklmnopqrstuvwxyz"];
  if ($("optUpper").checked) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if ($("optNumbers").checked) sets.push("0123456789");
  if ($("optSymbols").checked) sets.push("!@#$%^&*()-_=+?");

  const pool = sets.join("");
  const chosen = sets.map(randomChar);

  while (chosen.length < length) chosen.push(randomChar(pool));

  for (let i = chosen.length - 1; i > 0; i--) {
    const j = randomNumber(i + 1);
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }

  $("generatedPassword").value = chosen.join("");
}

$("lengthMinus").addEventListener("click", () => getLength(-1));
$("lengthPlus").addEventListener("click", () => getLength(1));
$("lengthInput").addEventListener("change", () => getLength());
$("generateBtn").addEventListener("click", generatePassword);

$("useBtn").addEventListener("click", () => {
  if ($("generatedPassword").value === "") return;
  $("passwordInput").value = $("generatedPassword").value;
  checkStrength();
  $("analyzer").scrollIntoView({ behavior: "smooth" });
});

$("copyBtn").addEventListener("click", () => {
  if ($("generatedPassword").value === "") return;
  copyText($("generatedPassword").value, $("copyBtn"));
});


function getRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data)) return data;
  } catch (error) {
    console.log("Could not read the saved data.");
  }
  return [];
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

$("saveForm").addEventListener("submit", event => {
  event.preventDefault();

  const site = $("siteName").value.trim();
  const user = $("username").value.trim();
  const pass = $("demoPassword").value.trim();

  if (site === "" || user === "" || pass === "") return showToast("Fill in every box before saving.", true);

  const records = getRecords();
  const exists = records.some(r => r.site.toLowerCase() === site.toLowerCase() &&
                                   r.username.toLowerCase() === user.toLowerCase());
  if (exists) return showToast("That account is already saved.", true);

  records.push({ id: Date.now(), site: site, username: user, password: pass });
  saveRecords(records);
  $("saveForm").reset();
  renderRecords();
  checkStrength();
  showToast("Account saved", false);
});

function deleteRecord(id) {
  saveRecords(getRecords().filter(record => record.id !== id));
  renderRecords();
  checkStrength();
  showToast("Account deleted", false);
}

let editingRecordId = null;

function createEditInput(value, label, type = "text") {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.setAttribute("aria-label", label);
  input.required = true;
  return input;
}

function saveEditedRecord(record, siteInput, usernameInput, passwordInput) {
  const site = siteInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (site === "" || username === "" || password === "") {
    return showToast("Fill in every box before saving.", true);
  }

  const records = getRecords();
  const duplicate = records.some(item =>
    item.id !== record.id &&
    item.site.toLowerCase() === site.toLowerCase() &&
    item.username.toLowerCase() === username.toLowerCase()
  );
  if (duplicate) return showToast("That account is already saved.", true);

  saveRecords(records.map(item => item.id === record.id
    ? { ...item, site, username, password }
    : item
  ));
  editingRecordId = null;
  renderRecords();
  checkStrength();
  showToast("Account updated", false);
}

function renderRecords() {
  const records = getRecords();
  const term = $("searchBox").value.trim().toLowerCase();
  const body = $("recordsBody");
  body.innerHTML = "";

  const shown = records.filter(r => r.site.toLowerCase().includes(term) ||
                                    r.username.toLowerCase().includes(term));

  const message = records.length === 0 ? "No accounts saved yet." : shown.length === 0 ? "No results found." : "";
  if (message) {
    const td = body.insertRow().insertCell();
    td.colSpan = 4;
    td.textContent = message;
    return;
  }

  shown.forEach(record => {
    const tr = body.insertRow();

    if (editingRecordId === record.id) {
      const siteInput = createEditInput(record.site, "Website or app name");
      const usernameInput = createEditInput(record.username, "Username");
      const passwordInput = createEditInput(record.password, "Password", "password");
      tr.insertCell().appendChild(siteInput);
      tr.insertCell().appendChild(usernameInput);
      tr.insertCell().appendChild(passwordInput);
      const actionTd = tr.insertCell();
      actionTd.className = "actions";

      actionTd.appendChild(makeButton("Save", () => {
        saveEditedRecord(record, siteInput, usernameInput, passwordInput);
      }));
      actionTd.appendChild(document.createTextNode(" "));
      actionTd.appendChild(makeButton("Cancel", () => {
        editingRecordId = null;
        renderRecords();
      }));
      siteInput.focus();
      return;
    }

    tr.insertCell().textContent = record.site;
    tr.insertCell().textContent = record.username;

    const passTd = tr.insertCell();
    passTd.textContent = HIDDEN;

    const actionTd = tr.insertCell();
    actionTd.className = "actions";
    actionTd.appendChild(makeButton("Show", btn => {
      const showing = btn.textContent === "Show";
      passTd.textContent = showing ? record.password : HIDDEN;
      btn.textContent = showing ? "Hide" : "Show";
    }));
    actionTd.appendChild(document.createTextNode(" "));
    actionTd.appendChild(makeButton("Edit", () => {
      editingRecordId = record.id;
      renderRecords();
    }));
    actionTd.appendChild(document.createTextNode(" "));
    actionTd.appendChild(makeButton("Delete", () => {
      if (confirm("Do you want to delete " + record.site + "?")) deleteRecord(record.id);
    }, "delete-btn"));
  });
}

$("searchBox").addEventListener("input", renderRecords);


checkStrength();
renderRecords();