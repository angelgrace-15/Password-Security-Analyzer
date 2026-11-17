const passwordInput = document.getElementById("passwordInput");
const toggleBtn = document.getElementById("toggleBtn");
const analyzerCopyBtn = document.getElementById("analyzerCopyBtn");
const strengthText = document.getElementById("strengthText");
const strengthBar = document.getElementById("strengthBar");
const crackTime = document.getElementById("crackTime");
const warningsList = document.getElementById("warningsList");

const ruleLength = document.getElementById("ruleLength");
const ruleUpper = document.getElementById("ruleUpper");
const ruleLower = document.getElementById("ruleLower");
const ruleNumber = document.getElementById("ruleNumber");
const ruleSpecial = document.getElementById("ruleSpecial");

const generatedPassword = document.getElementById("generatedPassword");
const copyBtn = document.getElementById("copyBtn");
const lengthInput = document.getElementById("lengthInput");
const lengthMinus = document.getElementById("lengthMinus");
const lengthPlus = document.getElementById("lengthPlus");
const optUpper = document.getElementById("optUpper");
const optNumbers = document.getElementById("optNumbers");
const optSymbols = document.getElementById("optSymbols");
const generateBtn = document.getElementById("generateBtn");
const useBtn = document.getElementById("useBtn");

const saveForm = document.getElementById("saveForm");
const siteName = document.getElementById("siteName");
const username = document.getElementById("username");
const demoPassword = document.getElementById("demoPassword");
const searchBox = document.getElementById("searchBox");
const recordsBody = document.getElementById("recordsBody");

const toast = document.getElementById("toast");
let toastTimer;

const STORAGE_KEY = "passwordRecords";

const commonPasswords = [
  "password", "password1", "123456", "12345678", "123456789",
  "qwerty", "abc123", "letmein", "admin", "welcome",
  "iloveyou", "monkey", "111111", "dragon", "football"
];

const levelLabels = {
  "weak": "Weak",
  "medium": "Medium",
  "strong": "Strong",
  "very-strong": "Very Strong"
};


function showToast(message, isError) {
  toast.textContent = message;
  if (isError) {
    toast.classList.add("error");
  } else {
    toast.classList.remove("error");
  }
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}


function copyText(text) {
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
}


toggleBtn.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleBtn.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    toggleBtn.textContent = "Show";
  }
});


analyzerCopyBtn.addEventListener("click", function () {
  if (passwordInput.value === "") {
    showToast("Type a password first.", true);
    return;
  }

  copyText(passwordInput.value);
  analyzerCopyBtn.textContent = "Copied";
  showToast("Copied to clipboard", false);
  setTimeout(function () {
    analyzerCopyBtn.textContent = "Copy";
  }, 1500);
});


function setRule(element, passed) {
  if (passed) {
    element.classList.add("met");
  } else {
    element.classList.remove("met");
  }
}

function hasSequence(password) {
  const lower = password.toLowerCase();
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const keyboard = "qwertyuiopasdfghjklzxcvbnm";

  for (let i = 0; i <= lower.length - 4; i++) {
    const piece = lower.substring(i, i + 4);
    if (letters.includes(piece) || digits.includes(piece) || keyboard.includes(piece)) {
      return true;
    }
  }
  return false;
}

function showWarnings(messages) {
  warningsList.innerHTML = "";
  for (let i = 0; i < messages.length; i++) {
    const li = document.createElement("li");
    li.textContent = messages[i];
    warningsList.appendChild(li);
  }
}

function formatTime(value, unit) {
  const rounded = Math.round(value);
  return rounded + " " + unit + (rounded === 1 ? "" : "s");
}

function estimateCrackTime(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;

  const seconds = Math.pow(pool, password.length) / 10000000000 / 2;

  if (seconds < 1) return "Instantly";
  if (seconds < 60) return formatTime(seconds, "second");

  const minutes = seconds / 60;
  if (minutes < 60) return formatTime(minutes, "minute");

  const hours = minutes / 60;
  if (hours < 24) return formatTime(hours, "hour");

  const days = hours / 24;
  if (days < 365) return formatTime(days, "day");

  const years = days / 365;
  if (years < 100) return formatTime(years, "year");

  return "Centuries";
}

function checkStrength() {
  const password = passwordInput.value;

  if (password === "") {
    strengthText.textContent = "None";
    strengthText.className = "";
    strengthBar.className = "";
    crackTime.textContent = "-";
    setRule(ruleLength, false);
    setRule(ruleUpper, false);
    setRule(ruleLower, false);
    setRule(ruleNumber, false);
    setRule(ruleSpecial, false);
    showWarnings(["Type a password to see tips."]);
    return;
  }

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  setRule(ruleLength, hasLength);
  setRule(ruleUpper, hasUpper);
  setRule(ruleLower, hasLower);
  setRule(ruleNumber, hasNumber);
  setRule(ruleSpecial, hasSpecial);

  let score = 0;
  if (hasLength) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  const warnings = [];

  if (!hasLength) warnings.push("The password is too short. Use at least 8 characters.");
  if (!hasUpper) warnings.push("Add a capital letter.");
  if (!hasLower) warnings.push("Add a small letter.");
  if (!hasNumber) warnings.push("Add at least one number.");
  if (!hasSpecial) warnings.push("Add a special character like @ or #.");

  const isCommon = commonPasswords.includes(password.toLowerCase());
  if (isCommon) {
    warnings.push("This password is too common. Pick something less predictable.");
  }
  if (/(.)\1\1/.test(password)) {
    warnings.push("Do not repeat the same character three times in a row.");
  }
  if (hasSequence(password)) {
    warnings.push("Avoid easy patterns like 1234 or abcd.");
  }

  const records = getRecords();
  let reusedSite = "";
  for (let i = 0; i < records.length; i++) {
    if (records[i].password === password) {
      reusedSite = records[i].site;
      break;
    }
  }
  if (reusedSite !== "") {
    warnings.push("You already use this password for " + reusedSite + ". Never reuse passwords.");
  }

  let level = "weak";
  if (score >= 5) {
    level = "strong";
  } else if (score >= 3) {
    level = "medium";
  }

  if (isCommon || reusedSite !== "") {
    level = "weak";
  }
  if (level === "strong" && warnings.length > 0) {
    level = "medium";
  }
  if (level === "strong" && password.length >= 12) {
    level = "very-strong";
  }

  strengthText.textContent = levelLabels[level];
  strengthText.className = level;
  strengthBar.className = level;

  if (isCommon) {
    crackTime.textContent = "Instantly";
  } else {
    crackTime.textContent = estimateCrackTime(password);
  }

  if (warnings.length === 0) {
    showWarnings(["Nice, no problems found."]);
  } else {
    showWarnings(warnings);
  }
}

passwordInput.addEventListener("input", checkStrength);


function randomNumber(max) {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

function randomChar(characters) {
  return characters.charAt(randomNumber(characters.length));
}

function getLength() {
  let value = parseInt(lengthInput.value, 10);
  if (isNaN(value)) {
    value = 12;
  }
  value = Math.min(32, Math.max(6, value));
  lengthInput.value = value;
  return value;
}

function generatePassword() {
  const length = getLength();
  const lowerSet = "abcdefghijklmnopqrstuvwxyz";
  const upperSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numberSet = "0123456789";
  const symbolSet = "!@#$%^&*()-_=+?";

  let pool = lowerSet;
  const chosen = [randomChar(lowerSet)];

  if (optUpper.checked) {
    pool += upperSet;
    chosen.push(randomChar(upperSet));
  }
  if (optNumbers.checked) {
    pool += numberSet;
    chosen.push(randomChar(numberSet));
  }
  if (optSymbols.checked) {
    pool += symbolSet;
    chosen.push(randomChar(symbolSet));
  }

  while (chosen.length < length) {
    chosen.push(randomChar(pool));
  }

  for (let i = chosen.length - 1; i > 0; i--) {
    const j = randomNumber(i + 1);
    const temp = chosen[i];
    chosen[i] = chosen[j];
    chosen[j] = temp;
  }

  generatedPassword.value = chosen.join("");
}

lengthMinus.addEventListener("click", function () {
  lengthInput.value = getLength() - 1;
  generatePassword();
});

lengthPlus.addEventListener("click", function () {
  lengthInput.value = getLength() + 1;
  generatePassword();
});

lengthInput.addEventListener("change", generatePassword);

generateBtn.addEventListener("click", generatePassword);
optUpper.addEventListener("change", generatePassword);
optNumbers.addEventListener("change", generatePassword);
optSymbols.addEventListener("change", generatePassword);

useBtn.addEventListener("click", function () {
  if (generatedPassword.value === "") {
    return;
  }

  passwordInput.value = generatedPassword.value;
  checkStrength();
  document.getElementById("analyzer").scrollIntoView({ behavior: "smooth" });
});

copyBtn.addEventListener("click", function () {
  if (generatedPassword.value === "") {
    return;
  }

  copyText(generatedPassword.value);

  copyBtn.textContent = "Copied";
  showToast("Copied to clipboard", false);
  setTimeout(function () {
    copyBtn.textContent = "Copy";
  }, 1500);
});


function getRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    console.log("Could not read the saved data.");
  }
  return [];
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

saveForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const site = siteName.value.trim();
  const user = username.value.trim();
  const pass = demoPassword.value.trim();

  if (site === "" || user === "" || pass === "") {
    showToast("Fill in every box before saving.", true);
    return;
  }

  const records = getRecords();

  for (let i = 0; i < records.length; i++) {
    if (records[i].site.toLowerCase() === site.toLowerCase() &&
        records[i].username.toLowerCase() === user.toLowerCase()) {
      showToast("That account is already saved.", true);
      return;
    }
  }

  records.push({
    id: Date.now(),
    site: site,
    username: user,
    password: pass
  });

  saveRecords(records);
  saveForm.reset();
  renderRecords();
  checkStrength();
  showToast("Account saved", false);
});


function deleteRecord(id) {
  const records = getRecords().filter(function (record) {
    return record.id !== id;
  });
  saveRecords(records);
  renderRecords();
  checkStrength();
  showToast("Account deleted", false);
}

function addMessageRow(message) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 4;
  td.textContent = message;
  tr.appendChild(td);
  recordsBody.appendChild(tr);
}

function renderRecords() {
  const records = getRecords();
  const term = searchBox.value.trim().toLowerCase();

  recordsBody.innerHTML = "";

  const shown = records.filter(function (record) {
    return record.site.toLowerCase().includes(term) ||
           record.username.toLowerCase().includes(term);
  });

  if (records.length === 0) {
    addMessageRow("No accounts saved yet.");
    return;
  }
  if (shown.length === 0) {
    addMessageRow("No results found.");
    return;
  }

  shown.forEach(function (record) {
    const tr = document.createElement("tr");

    const siteTd = document.createElement("td");
    siteTd.textContent = record.site;

    const userTd = document.createElement("td");
    userTd.textContent = record.username;

    const passTd = document.createElement("td");
    passTd.textContent = "••••••••";

    const actionTd = document.createElement("td");

    const showBtn = document.createElement("button");
    showBtn.type = "button";
    showBtn.textContent = "Show";
    showBtn.addEventListener("click", function () {
      if (showBtn.textContent === "Show") {
        passTd.textContent = record.password;
        showBtn.textContent = "Hide";
      } else {
        passTd.textContent = "••••••••";
        showBtn.textContent = "Show";
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", function () {
      const sure = confirm("Do you want to delete " + record.site + "?");
      if (sure) {
        deleteRecord(record.id);
      }
    });

    actionTd.className = "actions";
    actionTd.appendChild(showBtn);
    actionTd.appendChild(document.createTextNode(" "));
    actionTd.appendChild(deleteBtn);

    tr.appendChild(siteTd);
    tr.appendChild(userTd);
    tr.appendChild(passTd);
    tr.appendChild(actionTd);
    recordsBody.appendChild(tr);
  });
}

searchBox.addEventListener("input", renderRecords);


checkStrength();
generatePassword();
renderRecords();