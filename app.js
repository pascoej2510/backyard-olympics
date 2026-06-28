const teams = [
  "Red Rockets", "Blue Bombers", "Green Giants", "Gold Rush",
  "Purple Bulls", "Orange Crush", "Tidal Wave", "Blackouts"
];

const events = ["Cornhole", "KanJam", "Ladder Ball", "Bottle Bash", "Flip Cup", "Beer Pong"];
const grillStatuses = ["Burgers Ready Soon", "Hot Dogs On", "Burgers Ready", "Grab Drinks", "Dessert Served"];

let scores = JSON.parse(localStorage.getItem("scores")) || Object.fromEntries(teams.map(t => [t, 0]));
let eventIndex = Number(localStorage.getItem("eventIndex") || 0);
let grillIndex = Number(localStorage.getItem("grillIndex") || 0);

function save() {
  localStorage.setItem("scores", JSON.stringify(scores));
  localStorage.setItem("eventIndex", eventIndex);
  localStorage.setItem("grillIndex", grillIndex);
}

function renderLeaderboard() {
  const el = document.getElementById("leaderboard");
  if (!el) return;
  const sorted = [...teams].sort((a,b) => scores[b] - scores[a]);
  el.innerHTML = sorted.map((team, i) => `
    <div class="team-row">
      <strong>${i + 1}</strong>
      <span>${team}</span>
      <strong>${scores[team]}</strong>
    </div>
  `).join("");
}

function renderSchedule() {
  const el = document.getElementById("schedule");
  if (!el) return;
  el.innerHTML = events.map((event, i) => {
    const icon = i < eventIndex ? "✅" : i === eventIndex ? "🔥" : "⏳";
    return `<li>${icon} ${event}</li>`;
  }).join("");
  document.getElementById("currentEvent").textContent = events[eventIndex] || "Champion Ceremony";
  document.getElementById("grillStatus").textContent = grillStatuses[grillIndex];
}

function addScore(team, points) {
  scores[team] = Math.max(0, (scores[team] || 0) + points);
  save();
  renderLeaderboard();
}

function nextEvent() {
  eventIndex = Math.min(events.length, eventIndex + 1);
  save();
  renderSchedule();
}

function cycleGrill() {
  grillIndex = (grillIndex + 1) % grillStatuses.length;
  save();
  renderSchedule();
}

function getCaptainTeam() {
  const params = new URLSearchParams(window.location.search);
  return params.get("team") || "Red Rockets";
}

function captainAdd(points) {
  const team = getCaptainTeam();
  scores[team] = Math.max(0, (scores[team] || 0) + points);
  save();
  const captainScore = document.getElementById("captainScore");
  if (captainScore) captainScore.textContent = scores[team];
}

function renderCaptain() {
  const teamName = document.getElementById("teamName");
  if (!teamName) return;
  const team = getCaptainTeam();
  teamName.textContent = team;
  document.getElementById("captainScore").textContent = scores[team] || 0;
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
