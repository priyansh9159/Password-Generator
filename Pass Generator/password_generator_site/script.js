const passwordOutput = document.getElementById('passwordOutput');
const lengthRange = document.getElementById('lengthRange');
const lengthValue = document.getElementById('lengthValue');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const statusMessage = document.getElementById('statusMessage');
const strengthText = document.getElementById('strengthText');
const strengthBars = document.getElementById('strengthBars');

const characterSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/'
};
const similarCharacters = '0O1lI';

function secureRandomInt(max) {
  // Rejection sampling avoids the modulo bias of randomByte % max.
  if (!Number.isSafeInteger(max) || max < 1 || max > 256) {
    throw new Error('Invalid random range.');
  }
  const limit = Math.floor(256 / max) * max;
  const byte = new Uint8Array(1);
  let value;
  do {
    crypto.getRandomValues(byte);
    value = byte[0];
  } while (value >= limit);
  return value % max;
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function getSelectedSets() {
  const excludeSimilar = document.getElementById('excludeSimilar').checked;
  return Object.entries(characterSets)
    .filter(([key]) => document.getElementById(key).checked)
    .map(([, chars]) => excludeSimilar
      ? [...chars].filter(char => !similarCharacters.includes(char)).join('')
      : chars)
    .filter(set => set.length > 0);
}

function updateRangeFill() {
  const min = Number(lengthRange.min);
  const max = Number(lengthRange.max);
  const value = Number(lengthRange.value);
  const percent = ((value - min) / (max - min)) * 100;
  lengthRange.style.background = `linear-gradient(to right, var(--accent) ${percent}%, #363c56 ${percent}%)`;
}

function updateStrength(password, selectedSetCount) {
  // A simple visual estimate based on length and variety, not a security audit.
  let level = 0;
  if (password.length >= 8) level++;
  if (password.length >= 12) level++;
  if (password.length >= 16) level++;
  if (selectedSetCount >= 3) level++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  strengthText.textContent = labels[level];
  strengthBars.dataset.level = String(level);
}

function generatePassword() {
  const length = Number(lengthRange.value);
  const sets = getSelectedSets();

  if (sets.length === 0) {
    passwordOutput.textContent = 'Select at least one option';
    strengthText.textContent = 'Unavailable';
    strengthBars.removeAttribute('data-level');
    statusMessage.textContent = 'Choose at least one character type to generate a password.';
    return;
  }
  if (!window.crypto || typeof crypto.getRandomValues !== 'function') {
    passwordOutput.textContent = 'Secure generator unavailable';
    statusMessage.textContent = 'Please use an up-to-date browser with Web Crypto support.';
    return;
  }

  const allCharacters = sets.join('');
  const result = [];

  // Add one character from every selected category first.
  for (const set of sets) {
    result.push(set[secureRandomInt(set.length)]);
  }

  // Fill the remaining length from the combined character pool.
  while (result.length < length) {
    result.push(allCharacters[secureRandomInt(allCharacters.length)]);
  }

  passwordOutput.textContent = shuffle(result).join('');
  updateStrength(passwordOutput.textContent, sets.length);
  statusMessage.textContent = 'Password generated locally. Copy it when you are ready.';
}

async function copyPassword() {
  const password = passwordOutput.textContent;
  if (!password || password === 'Click generate to begin' ||
      password === 'Select at least one option' ||
      password === 'Secure generator unavailable') {
    statusMessage.textContent = 'Generate a password before copying.';
    return;
  }

  try {
    await navigator.clipboard.writeText(password);
    statusMessage.textContent = 'Password copied to clipboard.';
    copyBtn.setAttribute('aria-label', 'Password copied');
    setTimeout(() => copyBtn.setAttribute('aria-label', 'Copy password'), 1400);
  } catch {
    statusMessage.textContent = 'Clipboard access was blocked. Select and copy the password manually.';
  }
}

lengthRange.addEventListener('input', () => {
  lengthValue.textContent = lengthRange.value;
  updateRangeFill();
});
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyPassword);

document.querySelectorAll('.option-card input, #excludeSimilar').forEach(input => {
  input.addEventListener('change', () => {
    const sets = getSelectedSets();
    if (sets.length === 0) {
      statusMessage.textContent = 'Select at least one character type.';
    } else {
      statusMessage.textContent = 'Settings updated. Generate a new password to apply them.';
    }
  });
});

updateRangeFill();
generatePassword();
