import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, set, onValue } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
const LIVE = !!window.FIREBASE_CONFIG;
let db=null, dbRef=null;
if(LIVE){ const fb=initializeApp(window.FIREBASE_CONFIG); db=getDatabase(fb); dbRef=ref(db,'backyardOlympics/main'); }
const GAMES=['Cornhole','Can Jam','Ladder Ball','Bottle Bash','Flip Cup','Beer Pong'];
const DEFAULT_TEAMS=['Blue Bombers','Corn Stars','Bottle Bashers','Flip Masters','Red Rockets','Lawn Legends','Pong Kings','Kan Jam Crew'];
const COLORS=['#35a7ff','#f7c948','#ff5c6c','#2bd576','#b56cff','#ff9d2e','#00d4c7','#ff72b6'];
const KEY='backyardOlympicsV2';
function initialState(){return{eventName:'Backyard Olympics',announcement:'Welcome to the games!',round:1,teams:DEFAULT_TEAMS.map((name,i)=>({id:'t'+i,name,color:COLORS[i],wins:0,losses:0,points:0,scored:0,allowed:0})),matches:makeSchedule(),results:[]}}
function makeSchedule(){let matches=[];let pairs=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,3],[1,2],[4,7],[5,6],[0,4],[1,5],[2,6],[3,7],[0,5],[1,4],[2,7],[3,6],[0,6],[1,7],[2,4],[3,5]];pairs.forEach((p,i)=>matches.push({id:'m'+i,round:Math.floor(i/4)+1,game:GAMES[i%GAMES.length],teamA:'t'+p[0],teamB:'t'+p[1],scoreA:null,scoreB:null,complete:false,court:(i%4)+1}));return matches}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||initialState()}catch(e){return initialState()}}
async function save(s){ if(LIVE){ await set(dbRef,s); } else { localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new Event('storage')); }}
let state=load();
function qs(){return new URLSearchParams(location.search)}
function team(id){return state.teams.find(t=>t.id===id)}
function sortedTeams(){return [...state.teams].sort((a,b)=>b.points-a.points||b.wins-a.wins||((b.scored-b.allowed)-(a.scored-a.allowed)))}
function currentMatches(){return state.matches.filter(m=>!m.complete).slice(0,4)}
function medal(i){return ['🥇','🥈','🥉'][i]||`${i+1}`}
function render(){state=load();let view=qs().get('view')||'tv'; if(view==='captain') return renderCaptain(qs().get('team')||'t0'); if(view==='admin') return renderAdmin(); renderTV()}
function shell(content){document.getElementById('app').innerHTML=content}
function topNav(){return `<div class="top"><div class="brand"><h1>🏆 ${state.eventName}</h1><p>Round ${state.round} • Live tournament scoreboard</p></div><div class="nav"><button class="btn" onclick="location.href='?view=tv'">TV</button><button class="btn" onclick="location.href='?view=admin'">Admin</button></div></div>`}
function renderTV(){let rows=sortedTeams().map((t,i)=>`<div class="team-row" style="border-left-color:${t.color}"><div class="place">${medal(i)}</div><div><div class="team-name">${t.name}</div><div class="team-meta">PD ${t.scored-t.allowed} • For ${t.scored} / Against ${t.allowed}</div></div><div class="points">${t.points}</div><div class="record">${t.wins}-${t.losses}</div></div>`).join('');let matches=currentMatches().map(m=>`<div class="match"><h3>${m.game}</h3><p>Court ${m.court} • Round ${m.round}</p><div class="scoreline"><span style="color:${team(m.teamA).color}">${team(m.teamA).name}</span> vs <span style="color:${team(m.teamB).color}">${team(m.teamB).name}</span></div></div>`).join('')||`<div class="announce">🏆 Champion: ${sortedTeams()[0].name}</div><div class="confetti">${Array.from({length:50},(_,i)=>`<i style="left:${Math.random()*100}%;animation-delay:${Math.random()*3}s;background:${COLORS[i%COLORS.length]}"></i>`).join('')}</div>`;shell(`<div class="wrap">${topNav()}<div class="grid"><div class="card"><h2 class="section-title">Leaderboard</h2><div class="leader">${rows}</div></div><div><div class="card"><h2 class="section-title">Now Playing</h2>${matches}</div><br><div class="card"><h2 class="section-title">Announcement</h2><div class="announce">${state.announcement}</div></div></div></div><div class="footer">Captain links are in Admin. Keep this screen open on the TV.</div></div>`)}
function renderCaptain(teamId){let t=team(teamId)||state.teams[0];let m=state.matches.find(x=>!x.complete&&(x.teamA===t.id||x.teamB===t.id));let body=m?`<div class="card"><h2 class="section-title">Your Match</h2><div class="match"><h3>${m.game}</h3><p>Court ${m.court} • Round ${m.round}</p><div class="scoreline">${team(m.teamA).name} vs ${team(m.teamB).name}</div></div><div class="big-score"><div class="scorebox"><label>${team(m.teamA).name}</label><input class="input" id="sa" type="number" value="0"></div><div class="scorebox"><label>${team(m.teamB).name}</label><input class="input" id="sb" type="number" value="0"></div></div><br><button class="btn primary" style="width:100%;font-size:22px" onclick="submitScore('${m.id}')">Submit Final Score</button></div>`:`<div class="card"><div class="announce">No active match right now. Check the TV.</div></div>`;shell(`<div class="phone"><div class="brand"><h1 style="color:${t.color}">📱 ${t.name}</h1><p>Captain score entry</p></div>${body}<div class="footer"><button class="btn" onclick="location.href='?view=tv'">Open TV View</button></div></div>`)}
function submitScore(id){let s=load();let m=s.matches.find(x=>x.id===id);let a=Number(document.getElementById('sa').value),b=Number(document.getElementById('sb').value);if(!Number.isFinite(a)||!Number.isFinite(b)||a===b){alert('Enter a valid non-tie final score.');return}m.scoreA=a;m.scoreB=b;m.complete=true;let ta=s.teams.find(t=>t.id===m.teamA),tb=s.teams.find(t=>t.id===m.teamB);ta.scored+=a;ta.allowed+=b;tb.scored+=b;tb.allowed+=a;if(a>b){ta.wins++;tb.losses++;ta.points+=3}else{tb.wins++;ta.losses++;tb.points+=3}s.round=Math.max(1,...s.matches.filter(x=>!x.complete).map(x=>x.round));save(s);alert('Score submitted!');render()}
function renderAdmin(){let teamEdit=state.teams.map(t=>`<div class="formrow"><label>${t.id.toUpperCase()} Name</label><input class="input" value="${t.name}" onchange="renameTeam('${t.id}',this.value)"><span class="tiny">Captain link: <code>${location.origin+location.pathname}?view=captain&team=${t.id}</code></span></div>`).join('');let open=currentMatches().map(m=>`<div class="match"><b>${m.game}</b><p>${team(m.teamA).name} vs ${team(m.teamB).name} • Court ${m.court}</p></div>`).join('');shell(`<div class="wrap">${topNav()}<div class="admin-grid"><div class="card"><h2 class="section-title">Control Center</h2><div class="formrow"><label>Event Name</label><input class="input" value="${state.eventName}" onchange="setEventName(this.value)"></div><div class="formrow"><label>Announcement</label><input class="input" value="${state.announcement}" onchange="setAnnouncement(this.value)"></div><button class="btn danger" onclick="resetAll()">Reset Tournament</button><p class="tiny">Tip: copy each captain link and make a QR code for it.</p></div><div class="card"><h2 class="section-title">Active Matches</h2>${open}</div><div class="card"><h2 class="section-title">Teams + Captain Links</h2>${teamEdit}</div><div class="card"><h2 class="section-title">Finished Results</h2><div class="list">${state.matches.filter(m=>m.complete).map(m=>`<span class="pill">${m.game}: ${team(m.teamA).name} ${m.scoreA} - ${m.scoreB} ${team(m.teamB).name}</span>`).join('')||'<p class="tiny">No scores yet.</p>'}</div></div></div></div>`)}
function renameTeam(id,name){let s=load();s.teams.find(t=>t.id===id).name=name;save(s);render()}
function setEventName(v){let s=load();s.eventName=v;save(s);render()}
function setAnnouncement(v){let s=load();s.announcement=v;save(s);render()}
function resetAll(){if(confirm('Reset all scores and team names?')){save(initialState());render()}}
if(LIVE){ onValue(dbRef,(snap)=>{ if(snap.exists()){ state=snap.val(); shellRender(); } else { save(initialState()); } }); }
function shellRender(){let view=qs().get('view')||'tv'; if(view==='captain') return renderCaptain(qs().get('team')||'t0'); if(view==='admin') return renderAdmin(); renderTV()}
window.addEventListener('storage',render);
if(!LIVE) setInterval(render,5000);
render();

// Expose handlers for inline HTML event attributes when app.js runs as an ES module.
window.submitScore = submitScore;
window.renameTeam = renameTeam;
window.setEventName = setEventName;
window.setAnnouncement = setAnnouncement;
window.resetAll = resetAll;
