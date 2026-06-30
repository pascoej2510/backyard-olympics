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
const KEY = 'backyardOlympicsV4OptionB';

function makeSchedule(){
  let matches=[];
  let pairs=[];
  for(let a=0; a<8; a++) for(let b=a+1; b<8; b++) pairs.push([a,b]);
  pairs.forEach((p,i)=>matches.push({
    id:'m'+i,
    round:Math.floor(i/4)+1,
    game:GAMES[i%GAMES.length],
    teamA:'t'+p[0],
    teamB:'t'+p[1],
    scoreA:null,
    scoreB:null,
    complete:false,
    court:(i%4)+1,
    submittedBy:'',
    submittedAt:''
  }));
  return matches;
}

function initialState(){
  return {
    eventName:'Backyard Olympics',
    announcement:'Welcome to the games!',
    scoringMode:'Option B: actual scores + point differential',
    round:1,
    teams:DEFAULT_TEAMS.map((name,i)=>({id:'t'+i,name,color:COLORS[i]})),
    matches:makeSchedule()
  };
}

function load(){try{return JSON.parse(localStorage.getItem(KEY))||initialState()}catch(e){return initialState()}}
async function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); state=s; if(LIVE) await set(dbRef,s); }
let state = load();

function qs(){return new URLSearchParams(location.search)}
function view(){return qs().get('view') || 'tv'}
function team(id){return state.teams.find(t=>t.id===id) || state.teams[0]}
function escapeHtml(str=''){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function baseUrl(){return location.origin + location.pathname}
function medal(i){return ['🥇','🥈','🥉'][i]||`${i+1}`}
function shell(content){document.getElementById('app').innerHTML=content}

function calcStats(){
  const stats = Object.fromEntries(state.teams.map(t=>[t.id,{...t,wins:0,losses:0,ties:0,matchPts:0,scored:0,allowed:0,played:0}]));
  state.matches.filter(m=>m.complete).forEach(m=>{
    const a=stats[m.teamA], b=stats[m.teamB];
    a.played++; b.played++;
    a.scored += Number(m.scoreA)||0; a.allowed += Number(m.scoreB)||0;
    b.scored += Number(m.scoreB)||0; b.allowed += Number(m.scoreA)||0;
    if(m.scoreA>m.scoreB){ a.wins++; b.losses++; a.matchPts+=3; }
    else if(m.scoreB>m.scoreA){ b.wins++; a.losses++; b.matchPts+=3; }
    else { a.ties++; b.ties++; a.matchPts+=1; b.matchPts+=1; }
  });
  return Object.values(stats).map(t=>({...t,diff:t.scored-t.allowed}));
}
function sortedTeams(){return calcStats().sort((a,b)=>b.matchPts-a.matchPts||b.wins-a.wins||b.diff-a.diff||b.scored-a.scored||a.allowed-b.allowed)}
function currentMatches(){return state.matches.filter(m=>!m.complete).slice(0,4)}
function completedMatches(){return state.matches.filter(m=>m.complete)}
function nextRound(){const open=state.matches.filter(m=>!m.complete); return open.length ? Math.min(...open.map(m=>m.round)) : state.round}

function topNav(){return `<div class="top"><div class="brand"><h1>🏆 ${escapeHtml(state.eventName)}</h1><p>Option B scoring • Win 3 / Tie 1 • Tiebreakers: wins, point differential, points scored</p><p>${LIVE ? 'Firebase live sync on' : 'Demo mode: this device only until Firebase is connected'}</p></div><div class="nav"><button class="btn" onclick="location.href='?view=tv'">TV</button><button class="btn" onclick="location.href='?view=admin'">Admin</button></div></div>`}

function render(){
  if(!LIVE) state=load();
  if(view()==='captain') return renderCaptain(qs().get('team')||'t0');
  if(view()==='admin') return renderAdmin();
  renderTV();
}

function renderTV(){
  const standings=sortedTeams();
  let rows=standings.map((t,i)=>`<div class="team-row" style="border-left-color:${t.color}"><div class="place">${medal(i)}</div><div><div class="team-name">${escapeHtml(t.name)}</div><div class="team-meta">${t.wins}-${t.losses}${t.ties?'-'+t.ties:''} • PD ${t.diff>=0?'+':''}${t.diff} • For ${t.scored}</div></div><div class="points">${t.matchPts}</div><div class="record">GP ${t.played}</div></div>`).join('');
  let matches=currentMatches().map(m=>`<div class="match"><h3>${escapeHtml(m.game)}</h3><p>Court ${m.court} • Round ${m.round}</p><div class="scoreline"><span style="color:${team(m.teamA).color}">${escapeHtml(team(m.teamA).name)}</span> vs <span style="color:${team(m.teamB).color}">${escapeHtml(team(m.teamB).name)}</span></div></div>`).join('')||`<div class="announce">🏆 Champion: ${escapeHtml(standings[0].name)}<br><span class="tiny">Final: ${standings[0].matchPts} pts • PD ${standings[0].diff>=0?'+':''}${standings[0].diff}</span></div>`;
  let recent=completedMatches().slice(-5).reverse().map(m=>`<span class="pill">${m.game}: ${escapeHtml(team(m.teamA).name)} ${m.scoreA} - ${m.scoreB} ${escapeHtml(team(m.teamB).name)}</span>`).join('') || '<p class="tiny">No scores submitted yet.</p>';
  shell(`<div class="wrap">${topNav()}<div class="grid"><div class="card"><h2 class="section-title">Leaderboard</h2><div class="leader">${rows}</div></div><div><div class="card"><h2 class="section-title">Now Playing</h2>${matches}</div><br><div class="card"><h2 class="section-title">Recent Results</h2><div class="list">${recent}</div></div><br><div class="card"><h2 class="section-title">Announcement</h2><div class="announce">${escapeHtml(state.announcement)}</div></div></div></div><div class="footer">Actual scores now drive the standings: match points, point differential, and points scored.</div></div>`)
}

function renderCaptain(teamId){
  let t=team(teamId)||state.teams[0];
  let m=state.matches.find(x=>!x.complete&&(x.teamA===t.id||x.teamB===t.id));
  let body=m?`<div class="card"><h2 class="section-title">Your Match</h2><div class="match"><h3>${escapeHtml(m.game)}</h3><p>Court ${m.court} • Round ${m.round}</p><div class="scoreline">${escapeHtml(team(m.teamA).name)} vs ${escapeHtml(team(m.teamB).name)}</div></div><div class="big-score"><div class="scorebox"><label>${escapeHtml(team(m.teamA).name)}</label><input class="input" id="sa" inputmode="numeric" type="number" min="0" value="0"></div><div class="scorebox"><label>${escapeHtml(team(m.teamB).name)}</label><input class="input" id="sb" inputmode="numeric" type="number" min="0" value="0"></div></div><p class="tiny">Enter the actual final score. Point differential is used as a tiebreaker.</p><button class="btn primary" style="width:100%;font-size:22px" onclick="submitScore('${m.id}','${t.id}')">Submit Final Score</button></div>`:`<div class="card"><div class="announce">No active match right now. Check the TV.</div></div>`;
  shell(`<div class="phone"><div class="brand"><h1 style="color:${t.color}">📱 ${escapeHtml(t.name)}</h1><p>Captain score entry</p></div>${body}<div class="footer"><button class="btn" onclick="location.href='?view=tv'">Open TV View</button></div></div>`)
}

async function submitScore(id, submittedBy='admin'){
  let s=load(); let m=s.matches.find(x=>x.id===id);
  let a=Number(document.getElementById('sa-'+id)?.value ?? document.getElementById('sa')?.value);
  let b=Number(document.getElementById('sb-'+id)?.value ?? document.getElementById('sb')?.value);
  if(!m){alert('Match not found.');return}
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b<0){alert('Enter valid scores.');return}
  if(!confirm(`Submit final score?\n${team(m.teamA).name} ${a} - ${b} ${team(m.teamB).name}`)) return;
  m.scoreA=a; m.scoreB=b; m.complete=true; m.submittedBy=submittedBy; m.submittedAt=new Date().toISOString();
  s.round = nextRound();
  await save(s); alert('Score submitted!'); render();
}
async function reopenMatch(id){
  if(!confirm('Reopen this match and remove it from standings?')) return;
  let s=load(); let m=s.matches.find(x=>x.id===id); if(!m) return;
  m.scoreA=null; m.scoreB=null; m.complete=false; m.submittedBy=''; m.submittedAt='';
  await save(s); render();
}

function renderAdmin(){
  let teamEdit=state.teams.map(t=>`<div class="formrow"><label>${t.id.toUpperCase()} Team Name</label><input class="input admin-team" data-team="${t.id}" value="${escapeHtml(t.name)}"><label>Color</label><input class="input admin-color" data-team="${t.id}" type="color" value="${t.color}"><span class="tiny">Captain link:</span><div class="copybox"><code>${baseUrl()}?view=captain&team=${t.id}</code></div></div>`).join('');
  let gameList=GAMES.map(g=>`<span class="pill">${g}</span>`).join('');
  let open=state.matches.filter(m=>!m.complete).map(m=>`<div class="match admin-match"><b>R${m.round} • ${escapeHtml(m.game)} • Court ${m.court}</b><p>${escapeHtml(team(m.teamA).name)} vs ${escapeHtml(team(m.teamB).name)}</p><div class="mini-score"><input id="sa-${m.id}" class="input" inputmode="numeric" type="number" min="0" value="0"><span>-</span><input id="sb-${m.id}" class="input" inputmode="numeric" type="number" min="0" value="0"><button class="btn primary" onclick="submitScore('${m.id}','admin')">Submit</button></div></div>`).join('');
  let finished=state.matches.filter(m=>m.complete).map(m=>`<div class="match"><b>${m.game}</b><p>${escapeHtml(team(m.teamA).name)} ${m.scoreA} - ${m.scoreB} ${escapeHtml(team(m.teamB).name)}</p><button class="btn" onclick="reopenMatch('${m.id}')">Edit / Reopen</button></div>`).join('')||'<p class="tiny">No scores yet.</p>';
  let scheduleList=state.matches.map(m=>`<span class="pill">${m.complete?'✅':'⬜'} R${m.round} • ${m.game} • ${escapeHtml(team(m.teamA).name)} vs ${escapeHtml(team(m.teamB).name)}</span>`).join('');
  shell(`<div class="wrap">${topNav()}<div class="admin-grid"><div class="card"><h2 class="section-title">Control Center</h2><div class="formrow"><label>Event Name</label><input class="input" id="adminEventName" value="${escapeHtml(state.eventName)}"></div><div class="formrow"><label>Announcement</label><input class="input" id="adminAnnouncement" value="${escapeHtml(state.announcement)}"></div><button class="btn primary" onclick="saveAdminFields()">Save Admin Changes</button> <button class="btn danger" onclick="resetScoresOnly()">Reset Scores Only</button> <button class="btn danger" onclick="resetAll()">Reset Everything</button><p class="tiny">Option B is active: actual game scores feed point differential and points scored.</p></div><div class="card"><h2 class="section-title">Games Included</h2><div class="list">${gameList}</div></div><div class="card"><h2 class="section-title">Enter Scores</h2>${open||'<div class="announce">All matches complete.</div>'}</div><div class="card"><h2 class="section-title">Teams + Captain Links</h2>${teamEdit}</div><div class="card"><h2 class="section-title">Finished Results</h2>${finished}</div><div class="card"><h2 class="section-title">Full Schedule</h2><div class="list schedule-list">${scheduleList}</div></div></div></div>`)
}

async function saveAdminFields(){
  let s=load();
  s.eventName=document.getElementById('adminEventName').value.trim() || 'Backyard Olympics';
  s.announcement=document.getElementById('adminAnnouncement').value.trim();
  document.querySelectorAll('.admin-team').forEach(input=>{ let t=s.teams.find(x=>x.id===input.dataset.team); if(t) t.name=input.value.trim() || t.name; });
  document.querySelectorAll('.admin-color').forEach(input=>{ let t=s.teams.find(x=>x.id===input.dataset.team); if(t) t.color=input.value; });
  await save(s); alert('Admin changes saved.'); render();
}
async function resetScoresOnly(){
  if(!confirm('Reset scores but keep team names/colors?')) return;
  let s=load(); s.matches.forEach(m=>{m.scoreA=null;m.scoreB=null;m.complete=false;m.submittedBy='';m.submittedAt='';}); s.round=1;
  await save(s); render();
}
async function resetAll(){if(confirm('Reset everything: team names, colors, schedule, and scores?')){await save(initialState());render()}}

window.submitScore=submitScore; window.reopenMatch=reopenMatch; window.saveAdminFields=saveAdminFields; window.resetScoresOnly=resetScoresOnly; window.resetAll=resetAll;
if(LIVE){ onValue(dbRef,(snap)=>{ if(snap.exists()){ state=snap.val(); if(view()!=='admin') render(); } else { save(initialState()); } }); }
if(!LIVE) setInterval(()=>{ if(view()!=='admin') render(); },5000);
render();
