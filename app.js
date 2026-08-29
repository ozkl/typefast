const DEFAULT_TEXT = "Small improvements arrive quietly. Relax your shoulders, keep your eyes on the next word, and let each key land with purpose. Speed will follow a steady rhythm, so breathe, stay curious, and enjoy the practice.";

let text = DEFAULT_TEXT;
let index = 0;
let mistake = "";
let skippedMistakes = {};
let correctedMistakes = {};
let keystrokes = 0;
let errors = 0;
let startedAt = null;

const area = document.querySelector("#type-area");
const capture = document.querySelector("#capture");
const modal = document.querySelector("#modal");
const progress = document.querySelector("#progress");
const progressLabel = document.querySelector("#progress-label");
const advanceOnMistakes = document.querySelector("#advance-on-mistakes");
const darkMode = document.querySelector("#dark-mode");
const hint = document.querySelector("#hint");
const esc = (value) => value.replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[char]);

function render() {
  area.innerHTML = [...text].map((char, i) => {
    const state = i < index ? "done" : i === index ? "current" : "pending";
    const shownMistake = skippedMistakes[i] || (state === "current" ? mistake : "");
    return `<span class="char ${state} ${shownMistake ? "wrong" : ""} ${correctedMistakes[i] && !shownMistake ? "corrected" : ""}">${shownMistake ? `<span class="mistake">${esc(shownMistake)}</span>` : ""}${char === " " ? " " : esc(char)}</span>`;
  }).join("");
  const amount = Math.round(index / text.length * 100);
  progress.style.width = `${amount}%`;
  progressLabel.textContent = `${amount}% complete`;
}

function reset(next = text) {
  text = next;
  index = 0;
  mistake = "";
  skippedMistakes = {};
  correctedMistakes = {};
  keystrokes = 0;
  errors = 0;
  startedAt = null;
  modal.innerHTML = "";
  render();
  setTimeout(() => capture.focus());
}

function results() {
  const seconds = Math.max((Date.now() - startedAt) / 1000, .1);
  const accuracy = Math.round(((keystrokes - errors) / keystrokes) * 100);
  const wpm = Math.round((text.length / 5) / (seconds / 60));
  modal.innerHTML = `<div class="overlay"><section class="result-card" role="dialog" aria-modal="true"><p class="kicker">Test complete</p><h1>Nice rhythm.</h1><div class="metrics"><div><strong>${wpm}</strong><span>words / min</span></div><div><strong>${accuracy}%</strong><span>accuracy</span></div><div><strong>${seconds.toFixed(1)}s</strong><span>time</span></div></div><p class="error-note">${errors === 0 ? "A flawless run — zero mistakes." : `${errors} incorrect ${errors === 1 ? "key" : "keys"} along the way.`}</p><div class="actions"><button class="primary" id="again">Try again</button><button class="secondary" id="change">Change text</button></div></section></div>`;
  document.querySelector("#again").onclick = () => reset();
  document.querySelector("#change").onclick = openEditor;
}

function openEditor() {
  modal.innerHTML = `<div class="overlay"><form class="editor-card" id="editor"><p class="kicker">Custom practice</p><h1>What would you like to type?</h1><textarea id="draft" rows="7" placeholder="Paste or write your practice text here…">${esc(text)}</textarea><div class="actions"><button class="primary">Start test</button><button class="secondary" type="button" id="cancel">Cancel</button></div></form></div>`;
  const draft = document.querySelector("#draft");
  draft.focus();
  document.querySelector("#cancel").onclick = () => { modal.innerHTML = ""; capture.focus(); };
  document.querySelector("#editor").onsubmit = (event) => {
    event.preventDefault();
    const clean = draft.value.trim().replace(/\s+/g, " ");
    if (clean) reset(clean);
  };
}

capture.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === "Backspace" && advanceOnMistakes.checked) {
    event.preventDefault();
    if (index > 0) {
      index--;
      mistake = "";
      render();
    }
    return;
  }

  if (event.key.length !== 1) return;
  event.preventDefault();
  startedAt ??= Date.now();
  keystrokes++;

  if (event.key === [...text][index]) {
    if (skippedMistakes[index]) {
      delete skippedMistakes[index];
      correctedMistakes[index] = true;
    }
    if (!advanceOnMistakes.checked && mistake) {
      correctedMistakes[index] = true;
    }
    index++;
    mistake = "";
  } else {
    errors++;
    const pressed = event.key === " " ? "␣" : event.key;
    if (advanceOnMistakes.checked) {
      skippedMistakes[index] = pressed;
      delete correctedMistakes[index];
      index++;
      mistake = "";
    } else {
      mistake = pressed;
    }
  }

  render();
  if (index === text.length) results();
});

advanceOnMistakes.addEventListener("change", () => {
  mistake = "";
  hint.textContent = advanceOnMistakes.checked
    ? "Mistakes are marked and skipped. Use Backspace to return and correct them."
    : "Start typing anywhere. Mistakes stay in place until you press the right key.";
  capture.focus();
  render();
});

darkMode.checked = document.documentElement.dataset.theme === "dark";
darkMode.addEventListener("change", () => {
  const theme = darkMode.checked ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("typefast-theme", theme);
  capture.focus();
});

matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
  if (localStorage.getItem("typefast-theme")) return;
  document.documentElement.dataset.theme = event.matches ? "dark" : "light";
  darkMode.checked = event.matches;
});

document.querySelector("#app").onclick = () => capture.focus();
document.querySelector("#restart").onclick = (event) => { event.stopPropagation(); reset(); };
document.querySelector("#custom").onclick = (event) => { event.stopPropagation(); openEditor(); };
render();
capture.focus();
