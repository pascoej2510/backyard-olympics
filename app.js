import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, set, onValue } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const LIVE = !!window.FIREBASE_CONFIG;
let db = null, dbRef = null;
if (LIVE) {
  const fb = initializeApp(window.FIREBASE_CONFIG);
  db = getDatabase(fb);
  dbRef = ref(db, 'backyardOlympics/main');
}

const GAMES = ['Cornhole','Can Jam','Ladder Ball','Bottle Bash','Flip Cup','Beer Pong'];
const DEFAULT_TEAMS = ['Blue Bombers','Corn Stars','Bottle Bashers','Flip Masters','Red Rockets','Lawn Legends','Pong Kings','Kan Jam Crew'];
const COLORS = ['#35a7ff','#f7c948','#ff5c6c','#2bd576','#b56cff','#ff9d2e','#00d4c7','#ff72b6'];
const KEY = 'backyardOlympicsV3FullGames';

function makeSchedule(){
  // Full 8-team round robin: 28 total matches. Games rotate through every yard game.
  let matches=[];
  let pairs=[];
  for(let a=0; a<8; a++){
    for(let b=a+1; b<8; b++){ pairs.push([a,b]); }
  }
  pairs.forEach((p,i)=>matches.push({
    id:'m'+i,
    round:Math.floor(i/4)+1,
    game:GAMES[i%GAMES.length],
    teamA:'t'+p[0],
    teamB:'t'+p[1],
    scoreA:null,
    scoreB:null,
    complete:false,
    court:(i%4)+1
  }));
  return matches;
}
function initialState(){return{eventName:'Backyard Olympics',announcement:'Welcome to the games!',round:1,teams:DEFAULT_TEAMS.map((name,i)=>({id:'t'+i,name,color:COLORS[i],wins:0,losses:0,points:0,scored:0,allowed:0})),matches:makeSchedule(),results:[]}}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||initialState()}catch(e){return initialState()}}
async function save(s){
  localStorage.setItem(KEY, JSON.stringify(s));
  state = s;
  if (LIVE) await set(dbRef, s);
}
let state = load();
function qs(){return new URLSearchParams(location.search)}
function view(){return qs().get('view') || 'tv'}
function team(id){return state.teams.find(t=>t.id===id)}
function sortedTeams(){return [...state.teams].sort((a,b)=>b.points-a.points||b.wins-a.wins||((b.scored-b.allowed)-(a.scored-a.allowed)))}
function currentMatches(){return state.matches.filter(m=>!m.complete).slice(0,4)}
function medal(i){return ['🥇','🥈','🥉'][i]||`${i+1}`}
function shell(content){document.getElementById('app').innerHTML=content}
function topNav(){return `<div class="top"><div class="brand"><h1>🏆 ${escapeHtml(state.eventName)}</h1><p>Round ${state.round} • ${LIVE ? 'Firebase live sync on' : 'Demo mode: this device only until Firebase is connected'}</p></div><div class="nav"><button class="btn" onclick="location.href='?view=tv'">TV</button><button class="btn" onclick="location.href='?view=admin'">Admin</button></div></div>`}
function escapeHtml(str=''){return String(str).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function baseUrl(){return location.origin + location.pathname}

function render(){
  if (!LIVE) state = load();
  if(view()==='captain') return renderCaptain(qs().get('team')||'t0');
  if(view()==='admin') return renderAdmin();
  renderTV();
}
function renderTV(){
  let rows=sortedTeams().map((t,i)=>`<div class="team-row" style="border-left-color:${t.color}"><div class="place">${medal(i)}</div><div><div class="team-name">${escapeHtml(t.name)}</div><div class="team-meta">PD ${t.scored-t.allowed} • For ${t.scored} / Against ${t.allowed}</div></div><div class="points">${t.points}</div><div class="record">${t.wins}-${t.losses}</div></div>`).join('');
  let matches=currentMatches().map(m=>`<div class="match"><h3>${m.game}</h3><p>Court ${m.court} • Round ${m.round}</p><div class="scoreline"><span style="color:${team(m.teamA).color}">${escapeHtml(team(m.teamA).name)}</span> vs <span style="color:${team(m.teamB).color}">${escapeHtml(team(m.teamB).name)}</span></div></div>`).join('')||`<div class="announce">🏆 Champion: ${escapeHtml(sortedTeams()[0].name)}</div>`;
  shell(`<div class="wrap">${topNav()}<div class="grid"><div class="card"><h2 class="section-title">Leaderboard</h2><div class="leader">${rows}</div></div><div><div class="card"><h2 class="section-title">Now Playing</h2>${matches}</div><br><div class="card"><h2 class="section-title">Announcement</h2><div class="announce">${escapeHtml(state.announcement)}</div></div></div></div><div class="footer">Captain links are in Admin. Keep this screen open on the TV.</div></div>`)
}
function renderCaptain(teamId){
  let t=team(teamId)||state.teams[0];
  let m=state.matches.find(x=>!x.complete&&(x.teamA===t.id||x.teamB===t.id));
  let body=m?`<div class="card"><h2 class="section-title">Your Match</h2><div class="match"><h3>${m.game}</h3><p>Court ${m.court} • Round ${m.round}</p><div class="scoreline">${escapeHtml(team(m.teamA).name)} vs ${escapeHtml(team(m.teamB).name)}</div></div><div class="big-score"><div class="scorebox"><label>${escapeHtml(team(m.teamA).name)}</label><input class="input" id="sa" type="number" value="0"></div><div class="scorebox"><label>${escapeHtml(team(m.teamB).name)}</label><input class="input" id="sb" type="number" value="0"></div></div><br><button class="btn primary" style="width:100%;font-size:22px" onclick="submitScore('${m.id}')">Submit Final Score</button></div>`:`<div class="card"><div class="announce">No active match right now. Check the TV.</div></div>`;
  shell(`<div class="phone"><div class="brand"><h1 style="color:${t.color}">📱 ${escapeHtml(t.name)}</h1><p>Captain score entry</p></div>${body}<div class="footer"><button class="btn" onclick="location.href='?view=tv'">Open TV View</button></div></div>`)
}
async function submitScore(id){
  let s=load(); let m=s.matches.find(x=>x.id===id);
  let a=Number(document.getElementById('sa').value), b=Number(document.getElementById('sb').value);
  if(!Number.isFinite(a)||!Number.isFinite(b)||a===b){alert('Enter a valid non-tie final score.');return}
  m.scoreA=a; m.scoreB=b; m.complete=true;
  let ta=s.teams.find(t=>t.id===m.teamA), tb=s.teams.find(t=>t.id===m.teamB);
  ta.scored+=a; ta.allowed+=b; tb.scored+=b; tb.allowed+=a;
  if(a>b){ta.wins++;tb.losses++;ta.points+=3}else{tb.wins++;ta.losses++;tb.points+=3}
  s.round=Math.max(1,...s.matches.filter(x=>!x.complete).map(x=>x.round));
  await save(s); alert('Score submitted!'); render();
}
function renderAdmin(){
  let teamEdit=state.teams.map(t=>`<div class="formrow"><label>${t.id.toUpperCase()} Team Name</label><input class="input admin-team" data-team="${t.id}" value="${escapeHtml(t.name)}"><span class="tiny">Captain link:</span><div class="copybox"><code>${baseUrl()}?view=captain&team=${t.id}</code></div></div>`).join('');
  let open=currentMatches().map(m=>`<div class="match"><b>${m.game}</b><p>${escapeHtml(team(m.teamA).name)} vs ${escapeHtml(team(m.teamB).name)} • Court ${m.court}</p></div>`).join('');
  let gameList=GAMES.map(g=>`<span class="pill">${g}</span>`).join('');
  let scheduleList=state.matches.map(m=>`<span class="pill">R${m.round} • ${m.game} • ${escapeHtml(team(m.teamA).name)} vs ${escapeHtml(team(m.teamB).name)}</span>`).join('');
  shell(`<div class="wrap">${topNav()}<div class="admin-grid"><div class="card"><h2 class="section-title">Control Center</h2><div class="formrow"><label>Event Name</label><input class="input" id="adminEventName" value="${escapeHtml(state.eventName)}"></div><div class="formrow"><label>Announcement</label><input class="input" id="adminAnnouncement" value="${escapeHtml(state.announcement)}"></div><button class="btn primary" onclick="saveAdminFields()">Save Admin Changes</button> <button class="btn danger" onclick="resetAll()">Reset Tournament</button><p class="tiny">Fields are editable immediately. Type changes, then tap Save Admin Changes.</p></div><div class="card"><h2 class="section-title">Games Included</h2><div class="list">${gameList}</div><p class="tiny">Full schedule has ${state.matches.length} matches. Only the next 4 active matches show on the TV at once.</p></div><div class="card"><h2 class="section-title">Active Matches</h2>${open}</div><div class="card"><h2 class="section-title">Full Schedule</h2><div class="list schedule-list">${scheduleList}</div></div><div class="card"><h2 class="section-title">Teams + Captain Links</h2>${teamEdit}</div><div class="card"><h2 class="section-title">Finished Results</h2><div class="list">${state.matches.filter(m=>m.complete).map(m=>`<span class="pill">${m.game}: ${escapeHtml(team(m.teamA).name)} ${m.scoreA} - ${m.scoreB} ${escapeHtml(team(m.teamB).name)}</span>`).join('')||'<p class="tiny">No scores yet.</p>'}</div></div></div></div>`)
}
async function saveAdminFields(){
  let s=load();
  s.eventName=document.getElementById('adminEventName').value.trim() || 'Backyard Olympics';
  s.announcement=document.getElementById('adminAnnouncement').value.trim();
  document.querySelectorAll('.admin-team').forEach(input=>{
    let t=s.teams.find(x=>x.id===input.dataset.team); if(t) t.name=input.value.trim() || t.name;
  });
  await save(s); alert('Admin changes saved.'); render();
}
async function resetAll(){if(confirm('Reset all scores and team names?')){await save(initialState());render()}}

// Make handlers available BEFORE first render. This fixes iPhone/Safari inline button issues.
window.submitScore = submitScore;
window.saveAdminFields = saveAdminFields;
window.resetAll = resetAll;

if(LIVE){
  onValue(dbRef,(snap)=>{ if(snap.exists()){ state=snap.val(); if(view() !== 'admin') render(); } else { save(initialState()); } });
}

// Do not auto-rerender the Admin screen while someone is typing.
if(!LIVE) setInterval(()=>{ if(view() !== 'admin') render(); }, 5000);
render();
