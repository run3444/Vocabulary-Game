
const vocabulary = [
  {
    word: "Abridge",
    phonetic: "/əˈbrɪdʒ/",
    part: "verb",
    meaning: "To shorten a text while keeping its main meaning.",
    short: "shorten",
    example: "The editor had to abridge the article for the magazine.",
    choices: ["To shorten", "To explain in great detail", "To disagree publicly", "To arrange in order"]
  },
  {
    word: "Emendation",
    phonetic: "/ˌiːmenˈdeɪʃən/",
    part: "noun",
    meaning: "A correction or improvement made to a written text.",
    short: "correction",
    example: "The final emendation fixed a small error in the manuscript.",
    choices: ["A correction", "A prediction", "A long conversation", "A formal invitation"]
  },
  {
    word: "Finality",
    phonetic: "/faɪˈnæləti/",
    part: "noun",
    meaning: "The quality of being finished, settled, or unable to change.",
    short: "the end",
    example: "There was a sense of finality when the last page was turned.",
    choices: ["The state of being final", "A fresh beginning", "A temporary delay", "A public celebration"]
  },
  {
    word: "Garrulous",
    phonetic: "/ˈɡærələs/",
    part: "adjective",
    meaning: "Excessively talkative, especially about unimportant things.",
    short: "talkative",
    example: "Our garrulous neighbor can turn a quick hello into an hour-long chat.",
    choices: ["Excessively talkative", "Quiet and thoughtful", "Carefully organized", "Easily frightened"]
  },
  {
    word: "Impromptu",
    phonetic: "/ɪmˈprɒmptjuː/",
    part: "adjective",
    meaning: "Done without being planned or prepared in advance.",
    short: "unplanned",
    example: "We gave an impromptu performance in the living room.",
    choices: ["Unplanned or unprepared", "Carefully rehearsed", "Extremely expensive", "Difficult to understand"]
  },
  {
    word: "Invoke",
    phonetic: "/ɪnˈvəʊk/",
    part: "verb",
    meaning: "To call on or summon something, often for help or support.",
    short: "call upon",
    example: "The speaker chose to invoke a familiar proverb.",
    choices: ["To call upon or summon", "To hide from view", "To make something smaller", "To put off until later"]
  },
  {
    word: "Shrew",
    phonetic: "/ʃruː/",
    part: "noun",
    meaning: "A small, mouse-like insect-eating mammal; also an old-fashioned term for a bad-tempered woman.",
    short: "small mammal",
    example: "A tiny shrew darted beneath the leaves.",
    choices: ["A small, mouse-like mammal", "A large bird of prey", "A type of tree", "A deep ocean fish"]
  },
  {
    word: "Supercilious",
    phonetic: "/ˌsuːpəˈsɪliəs/",
    part: "adjective",
    meaning: "Behaving as though you are better or more important than others.",
    short: "arrogant",
    example: "His supercilious smile made the new students feel unwelcome.",
    choices: ["Arrogant or scornful", "Warm and welcoming", "Nervous and uncertain", "Honest and direct"]
  },
  {
    word: "Verbose",
    phonetic: "/vɜːˈbəʊs/",
    part: "adjective",
    meaning: "Using more words than are needed; wordy.",
    short: "wordy",
    example: "The report was so verbose that its main point got lost.",
    choices: ["Using too many words", "Clear and concise", "Full of useful pictures", "Written in secret code"]
  },
  {
    word: "Lucrative",
    phonetic: "/ˈluːkrətɪv/",
    part: "adjective",
    meaning: "Producing a great deal of money or profit.",
    short: "profitable",
    example: "The small design studio landed a lucrative contract.",
    choices: ["Profitable or rewarding", "Risky and uncertain", "Cheap to produce", "Popular for a short time"]
  }
];

const $ = selector => document.querySelector(selector);

const answerButtons = [...document.querySelectorAll(".answer")];
const questionArea = $("#question-area");
const resultsEl = $("#results");
const progressFill = $("#progress-fill");
const progressTrack = $("#progress-track");
const roundCount = $("#round-count");
const correctCount = $("#correct-count");
const streakCount = $("#streak-count");
const feedback = $("#feedback");
const nextButton = $("#next-button");
const soundToggle = $("#sound-toggle");

let order = [];
let current = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let locked = false;
let soundOn = false;
let audioContext;

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function playTone(correct) {
  if (!soundOn) return;

  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = correct ? 660 : 220;

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.16);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.17);
  } catch (_) {
    // Sound is optional.
  }
}

function renderShelf() {
  $("#word-grid").innerHTML = vocabulary.map((item, index) => `
    <article class="word-tile" data-word="${index}">
      <span class="tile-number">${String(index + 1).padStart(2, "0")}</span>
      <h3>${item.word}</h3>
      <p>${item.short}</p>
    </article>
  `).join("");

  $("#shelf-count").textContent = `${vocabulary.length} WORDS`;
}

function renderQuestion() {
  locked = false;

  const item = vocabulary[order[current]];
  const options = shuffle(item.choices);

  $("#question-kicker").textContent =
    `WORD ${String(current + 1).padStart(2, "0")} · PICK THE MEANING`;

  $("#question-title").textContent = item.word;
  $("#pronunciation").textContent = `${item.phonetic} · ${item.part}`;

  roundCount.innerHTML =
    `${String(current + 1).padStart(2, "0")} <span>/ ${vocabulary.length}</span>`;

  progressFill.style.width = `${(current / vocabulary.length) * 100}%`;
  progressTrack.setAttribute("aria-valuenow", String(current));

  feedback.hidden = true;
  feedback.classList.remove("is-wrong");

  answerButtons.forEach((button, index) => {
    button.disabled = false;
    button.className = "answer";

    button.querySelector(".answer-letter").textContent =
      String.fromCharCode(65 + index);

    button.querySelector(".answer-text").textContent = options[index];
    button.dataset.answer = options[index];
  });
}

function chooseAnswer(button) {
  if (locked) return;

  locked = true;

  const item = vocabulary[order[current]];
  const selected = button.dataset.answer;
  const isCorrect = selected === item.choices[0];

  answerButtons.forEach(option => {
    option.disabled = true;

    if (option.dataset.answer === item.choices[0]) {
      option.classList.add("is-correct");
    } else if (option === button && !isCorrect) {
      option.classList.add("is-wrong");
    } else {
      option.classList.add("is-muted");
    }
  });

  if (isCorrect) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);

    correctCount.textContent = String(score);
    streakCount.textContent = String(streak) + " ↗";

    $("#feedback-mark").textContent = "✓";
    $("#feedback-title").textContent = "Exactly right.";

    feedback.classList.remove("is-wrong");
    playTone(true);
  } else {
    streak = 0;
    streakCount.textContent = "0 ↗";

    $("#feedback-mark").textContent = "↗";
    $("#feedback-title").textContent =
      `Not quite — ${item.word} means ${item.short}.`;

    feedback.classList.add("is-wrong");
    playTone(false);
  }

  $("#feedback-detail").textContent = item.example;

  nextButton.innerHTML =
    current === vocabulary.length - 1
      ? "See results <span>↗</span>"
      : "Continue <span>↗</span>";

  feedback.hidden = false;

  progressFill.style.width =
    `${((current + 1) / vocabulary.length) * 100}%`;

  progressTrack.setAttribute("aria-valuenow", String(current + 1));

  const tile = document.querySelector(
    `.word-tile[data-word="${order[current]}"]`
  );

  if (tile) tile.classList.add("learned");
}

function showResults() {
  questionArea.hidden = true;
  resultsEl.hidden = false;

  progressFill.style.width = "100%";
  progressTrack.setAttribute("aria-valuenow", String(vocabulary.length));

  $("#final-score").textContent = `${score}/${vocabulary.length}`;
  $("#final-percent").textContent =
    `${Math.round((score / vocabulary.length) * 100)}%`;

  const heading =
    score === 10 ? "A perfect little run." :
    score >= 7 ? "Nicely done." :
    score >= 4 ? "Good groundwork." :
    "Every word is a start.";

  $("#result-heading").textContent = heading;

  $("#result-copy").textContent =
    `You got ${score} out of ${vocabulary.length}. Keep the curious streak alive.`;

  $("#correct-count").textContent = String(score);
  streakCount.textContent = String(bestStreak) + " ↗";
}

function advance() {
  if (!locked) return;

  if (current < vocabulary.length - 1) {
    current++;
    renderQuestion();
  } else {
    showResults();
  }
}

function startGame() {
  order = shuffle(vocabulary.map((_, index) => index));

  current = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;

  correctCount.textContent = "0";
  streakCount.textContent = "0 ↗";

  questionArea.hidden = false;
  resultsEl.hidden = true;

  renderShelf();
  renderQuestion();
}

answerButtons.forEach(button => {
  button.addEventListener("click", () => chooseAnswer(button));
});

nextButton.addEventListener("click", advance);
$("#restart-button").addEventListener("click", startGame);

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;

  soundToggle.setAttribute("aria-pressed", String(soundOn));

  soundToggle.querySelectorAll("span")[1].textContent =
    soundOn ? "Sound on" : "Sound off";

  if (soundOn) playTone(true);
});

document.addEventListener("keydown", event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;

  if (!locked && ["1", "2", "3", "4"].includes(event.key)) {
    answerButtons[Number(event.key) - 1].click();
  } else if (locked && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    nextButton.click();
  }
});

startGame();
