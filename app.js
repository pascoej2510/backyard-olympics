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

function renderLeaderboard() {
  const el = document.getElementById("leaderboard");
  if (!el) return;
  const sorted = teams.map((team, i) => ({team, score: scores[i] || 0, index: i}))
    .sort((a,b) => b.score - a.score);
  el.innerHTML = sorted.map((item, i) => `
    <div class="team-row">
      <strong>${i + 1}</strong>
      <span>${item.team}</span>
      <strong>${item.score}</strong>
    </div>
  `).join("");

  const teamA = document.getElementById("teamAName");
  const teamB = document.getElementById("teamBName");
  if (teamA) teamA.textContent = teams[0];
  if (teamB) teamB.textContent = teams[1];
}

function renderSchedule() {
  const el = document.getElementById("schedule");
  if (el) {
    el.innerHTML = events.map((event, i) => {
      const icon = i < eventIndex ? "✅" : i === eventIndex ? "🔥" : "⏳";
      return `<li>${icon} ${event}</li>`;
    }).join("");
  }
  const current = document.getElementById("currentEvent");
  if (current) current.textContent = events[eventIndex] || "Champion Ceremony";
  const grill = document.getElementById("grillStatus");
  if (grill) grill.textContent = grillStatuses[grillIndex];
  const musicInput = document.getElementById("musicInput");
  if (musicInput) musicInput.value = music;
}

function addScore(teamIndex, points) {
  scores[teamIndex] = Math.max(0, (scores[teamIndex] || 0) + points);
  save();
  renderLeaderboard();
  renderHost();
}

function nextEvent() {
  eventIndex = Math.min(events.length, eventIndex + 1);
  save();
  renderSchedule();
  renderHost();
}

function cycleGrill() {
  grillIndex = (grillIndex + 1) % grillStatuses.length;
  save();
  renderSchedule();
}

function setMusic(value) {
  music = value || "Party Playlist";
  save();
}

function getCaptainTeamIndex() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("team");
  const num = Number(raw);
  if (!Number.isNaN(num) && num >= 0 && num <= 7) return num;

  // Backward compatibility with old QR links that used team names.
  const nameIndex = teams.findIndex(t => t === raw);
  return nameIndex >= 0 ? nameIndex : 0;
}

function captainAdd(points) {
  const teamIndex = getCaptainTeamIndex();
  scores[teamIndex] = Math.max(0, (scores[teamIndex] || 0) + points);
  save();
  const captainScore = document.getElementById("captainScore");
  if (captainScore) captainScore.textContent = scores[teamIndex];
}

function renderCaptain() {
  const teamName = document.getElementById("teamName");
  if (!teamName) return;
  const teamIndex = getCaptainTeamIndex();
  teamName.textContent = teams[teamIndex];
  document.getElementById("captainScore").textContent = scores[teamIndex] || 0;
}

function renderHost() {
  const teamEditor = document.getElementById("teamEditor");
  if (!teamEditor) return;

  teamEditor.innerHTML = teams.map((team, i) => `
    <div class="editor-row">
      <label>Team ${i + 1}</label>
      <input id="teamInput${i}" value="${team.replaceAll('"', '&quot;')}" />
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
    <div class="qr-url"><strong>TV Scoreboard:</strong><br>${baseUrl}/index.html</div>
    ${teams.map((team, i) => `<div class="qr-url"><strong>Captain ${i + 1} - ${team}:</strong><br>${baseUrl}/captain.html?team=${i}</div>`).join("")}
  `;
}

function saveTeamNames() {
  teams = teams.map((team, i) => {
    const input = document.getElementById(`teamInput${i}`);
    return input.value.trim() || `Team ${i + 1}`;
  });
  save();
  renderHost();
  renderLeaderboard();
  renderCaptain();
  alert("Team names saved.");
}

function saveHostMusic() {
  const input = document.getElementById("hostMusicInput");
  music = input.value || "Party Playlist";
  save();
  alert("Music banner saved.");
}

function setEventFromHost(value) {
  eventIndex = Number(value);
  save();
  renderSchedule();
}

function resetScores() {
  if (!confirm("Reset all scores to zero?")) return;
  scores = Array(8).fill(0);
  save();
  renderHost();
  renderLeaderboard();
  renderCaptain();
}

function resetTournament() {
  if (!confirm("Reset scores, team names, event progress, music, and grill status?")) return;
  teams = defaultTeams;
  scores = Array(8).fill(0);
  eventIndex = 0;
  grillIndex = 0;
  music = "Party Playlist";
  save();
  renderHost();
  renderLeaderboard();
  renderSchedule();
  renderCaptain();
}

let seconds = 600;
setInterval(() => {
  const timer = document.getElementById("timer");
  if (!timer) return;
  seconds = Math.max(0, seconds - 1);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  timer.textContent = `${m}:${s}`;
}, 1000);

renderLeaderboard();
renderSchedule();
renderCaptain();
renderHost();
