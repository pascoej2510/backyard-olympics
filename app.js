const defaultTeams = [
  "Red Rockets", "Blue Bombers", "Green Giants", "Gold Rush",
  "Purple Bulls", "Orange Crush", "Tidal Wave", "Blackouts"
];

const events = ["Cornhole", "KanJam", "Ladder Ball", "Bottle Bash", "Flip Cup", "Beer Pong"];
const grillStatuses = ["Burgers Ready Soon", "Hot Dogs On", "Burgers Ready", "Grab Drinks", "Dessert Served"];

let teams = JSON.parse(localStorage.getItem("teams")) || defaultTeams;
let scores = JSON.parse(localStorage.getItem("scores")) || Array(8).fill(0);
let eventIndex = Number(localStorage.getItem("eventIndex") || 0);
let grillIndex = Number(localStorage.getItem("grillIndex") || 0);
let music = localStorage.getItem("music") || "Party Playlist";

function save() {
  localStorage.setItem("teams", JSON.stringify(teams));
  localStorage.setItem("scores", JSON.stringify(scores));
  localStorage.setItem("eventIndex", eventIndex);
  localStorage.setItem("grillIndex", grillIndex);
  localStorage.setItem("music", music);
}

function renderAll() {
  renderLeaderboard();
  renderSchedule();
  renderMatch();
  renderCaptain();
  renderHost();
  renderClock();
}

function renderLeaderboard() {
  const el = document.getElementById("leaderboard");
  if (!el) return;

  const sorted = teams.map((team, i) => ({ team, score: scores[i] || 0, index: i }))
    .sort((a, b) => b.score - a.score);

  el.innerHTML = sorted.map((item, i) => `
    <div class="team-row">
      <div class="rank">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</div>
      <div class="team-name">${item.team}</div>
      <div class="score-pill">${item.score}</div>
    </div>
  `).join("");
}

function renderMatch() {
  const teamAName = document.getElementById("teamAName");
  const teamBName = document.getElementById("teamBName");
  const teamAScore = document.getElementById("teamAScore");
  const teamBScore = document.getElementById("teamBScore");

  if (teamAName) teamAName.textContent = teams[0];
  if (teamBName) teamBName.textContent = teams[1];
  if (teamAScore) teamAScore.textContent = scores[0] || 0;
  if (teamBScore) teamBScore.textContent = scores[1] || 0;

  const musicDisplay = document.getElementById("musicDisplay");
  if (musicDisplay) musicDisplay.textContent = music;

  const grillStatus = document.getElementById("grillStatus");
  if (grillStatus) grillStatus.textContent = grillStatuses[grillIndex];

  const currentEvent = document.getElementById("currentEvent");
  if (currentEvent) currentEvent.textContent = events[eventIndex] || "Champion Ceremony";

  const currentEventSmall = document.getElementById("currentEventSmall");
  if (currentEventSmall) currentEventSmall.textContent = (events[eventIndex] || "Ceremony").toUpperCase();

  const nextEventName = document.getElementById("nextEventName");
  if (nextEventName) nextEventName.textContent = events[eventIndex + 1] || "Champion Ceremony";
}

function renderSchedule() {
  const el = document.getElementById("schedule");
  if (!el) return;

  el.innerHTML = events.map((event, i) => {
    const status = i < eventIndex ? "Complete" : i === eventIndex ? "Live Now" : "Upcoming";
    const icon = i < eventIndex ? "✅" : i === eventIndex ? "🔥" : "⏳";
    return `
      <div class="schedule-item">
        <span>${icon} ${event}</span>
        <strong>${status}</strong>
      </div>
    `;
  }).join("");
}

function addScore(teamIndex, points) {
  scores[teamIndex] = Math.max(0, (scores[teamIndex] || 0) + points);
  save();
  renderAll();
}

function nextEvent() {
  eventIndex = Math.min(events.length, eventIndex + 1);
  save();
  renderAll();
  showCelebration();
}

function cycleGrill() {
  grillIndex = (grillIndex + 1) % grillStatuses.length;
  save();
  renderAll();
}

function getCaptainTeamIndex() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("team");
  const num = Number(raw);
  if (!Number.isNaN(num) && num >= 0 && num <= 7) return num;

  const nameIndex = teams.findIndex(t => t === raw);
  return nameIndex >= 0 ? nameIndex : 0;
}

function captainAdd(points) {
  const teamIndex = getCaptainTeamIndex();
  scores[teamIndex] = Math.max(0, (scores[teamIndex] || 0) + points);
  save();
  renderAll();
}

function renderCaptain() {
  const teamName = document.getElementById("teamName");
  if (!teamName) return;

  const teamIndex = getCaptainTeamIndex();
  teamName.textContent = teams[teamIndex];

  const captainScore = document.getElementById("captainScore");
  if (captainScore) captainScore.textContent = scores[teamIndex] || 0;
}

function renderHost() {
  const teamEditor = document.getElementById("teamEditor");
  if (!teamEditor) return;

  teamEditor.innerHTML = teams.map((team, i) => `
    <div class="editor-row">
      <label>Team ${i + 1}</label>
      <input id="teamInput${i}" value="${escapeAttr(team)}" />
    </div>
  `).join("");

  const scoreEditor = document.getElementById("scoreEditor");
  scoreEditor.innerHTML = teams.map((team, i) => `
    <div class="score-row">
      <strong>${team}</strong>
      <span>${scores[i] || 0} pts</span>
      <button onclick="addScore(${i}, 1)">+1</button>
      <button onclick="addScore(${i}, -1)">-1</button>
    </div>
  `).join("");

  const eventSelect = document.getElementById("eventSelect");
  eventSelect.innerHTML = events.map((event, i) => `
    <option value="${i}" ${i === eventIndex ? "selected" : ""}>${event}</option>
  `).join("") + `<option value="${events.length}" ${eventIndex === events.length ? "selected" : ""}>Champion Ceremony</option>`;

  const hostMusicInput = document.getElementById("hostMusicInput");
  hostMusicInput.value = music;

  const baseUrl = "https://pascoej2510.github.io/backyard-olympics";
  const qrUrls = document.getElementById("qrUrls");
  qrUrls.innerHTML = `
    <div class="qr-url"><strong>Host:</strong><br>${baseUrl}/host.html</div>
    ${teams.map((team, i) => `<div class="qr-url"><strong>Captain ${i + 1} - ${team}:</strong><br>${baseUrl}/captain.html?team=${i}</div>`).join("")}
  `;
}

function saveTeamNames() {
  teams = teams.map((team, i) => {
    const input = document.getElementById(`teamInput${i}`);
    return input.value.trim() || `Team ${i + 1}`;
  });
  save();
  renderAll();
  alert("Team names saved.");
}

function saveHostMusic() {
  const input = document.getElementById("hostMusicInput");
  music = input.value || "Party Playlist";
  save();
  renderAll();
  alert("Music saved.");
}

function setEventFromHost(value) {
  eventIndex = Number(value);
  save();
  renderAll();
}

function resetScores() {
  if (!confirm("Reset all scores to zero?")) return;
  scores = Array(8).fill(0);
  save();
  renderAll();
}

function resetTournament() {
  if (!confirm("Reset everything?")) return;
  teams = defaultTeams;
  scores = Array(8).fill(0);
  eventIndex = 0;
  grillIndex = 0;
  music = "Party Playlist";
  save();
  renderAll();
}

function showCelebration() {
  const el = document.getElementById("celebration");
  if (!el) return;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2400);
}

function renderClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

let seconds = 600;
function renderTimer() {
  const el = document.getElementById("timer");
  if (!el) return;
  seconds = Math.max(0, seconds - 1);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  el.textContent = `${m}:${s}`;
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

setInterval(renderClock, 1000);
setInterval(renderTimer, 1000);
renderAll();
