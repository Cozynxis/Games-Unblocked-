const games=[
  {id:'snake',title:'Neon Snake',category:'arcade',description:'Grab the glowing food, grow longer and keep your run alive.',path:'games/snake.html',cover:'cover-snake',art:'SNAKE',badge:'ARCADE',plays:'Fast reflexes'},
  {id:'pong',title:'Brick Bounce',category:'classic',description:'A polished paddle-and-ball classic with score chasing and smooth controls.',path:'games/pong.html',cover:'cover-pong',art:'BOUNCE',badge:'CLASSIC',plays:'Skill based'},
  {id:'merge',title:'Tile Merge',category:'puzzle',description:'Slide matching number tiles together and build the highest tile you can.',path:'games/2048.html',cover:'cover-merge',art:'2048',badge:'PUZZLE',plays:'Think ahead'}
];

const state={filter:'all',query:'',view:localStorage.getItem('gu-view')||'grid',favorites:JSON.parse(localStorage.getItem('gu-favorites')||'[]'),recent:JSON.parse(localStorage.getItem('gu-recent')||'[]')};
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];

function save(){localStorage.setItem('gu-favorites',JSON.stringify(state.favorites));localStorage.setItem('gu-recent',JSON.stringify(state.recent));localStorage.setItem('gu-view',state.view)}
function gameById(id){return games.find(g=>g.id===id)}
function launch(id){const game=gameById(id);if(!game)return;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,6);save();renderRecent();window.location.href=game.path}
function toggleFavorite(id,e){if(e)e.stopPropagation();state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();renderGames()}
function card(g){const fav=state.favorites.includes(g.id);return `<article class="game-card" data-id="${g.id}" tabindex="0" role="button" aria-label="Play ${g.title}"><div class="game-cover ${g.cover}"><div class="game-art">${g.art}</div><span class="game-badge">${g.badge}</span></div><div class="game-info"><div class="game-title-row"><h3>${g.title}</h3><button class="favorite-btn ${fav?'active':''}" data-fav="${g.id}" title="Favorite">${fav?'★':'☆'}</button></div><p>${g.description}</p><div class="meta-row"><span>${g.plays}</span><span>Play now →</span></div></div></article>`}
function renderGames(){const filtered=games.filter(g=>(state.filter==='all'||g.category===state.filter)&&(`${g.title} ${g.description} ${g.category}`.toLowerCase().includes(state.query.toLowerCase())));$('#gamesGrid').innerHTML=filtered.map(card).join('');$('#gamesGrid').className=`games-grid ${state.view==='compact'?'compact':''}`;$('#emptyState').classList.toggle('hidden',filtered.length>0);$$('.game-card').forEach(el=>{el.onclick=()=>launch(el.dataset.id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();launch(el.dataset.id)}}});$$('[data-fav]').forEach(btn=>btn.onclick=e=>toggleFavorite(btn.dataset.fav,e))}
function renderPopular(){const order=['snake','merge','pong'];$('#popularList').innerHTML=order.map((id,i)=>{const g=gameById(id);return `<div class="rank-item" data-play="${id}"><span class="rank-num">0${i+1}</span><span class="mini-icon">${g.art.slice(0,2)}</span><div class="rank-copy"><strong>${g.title}</strong><span>${g.badge.toLowerCase()}</span></div><span class="play-arrow">→</span></div>`}).join('');$$('[data-play]').forEach(el=>el.onclick=()=>launch(el.dataset.play))}
function renderRecent(){const list=state.recent.map(gameById).filter(Boolean);$('#recentList').innerHTML=list.length?list.map(g=>`<div class="recent-item" data-recent="${g.id}"><span class="mini-icon">${g.art.slice(0,2)}</span><div class="recent-copy"><strong>${g.title}</strong><span>Continue playing</span></div><span class="play-arrow">→</span></div>`).join(''):`<div class="empty-mini">Play a game and it will appear here.</div>`;$$('[data-recent]').forEach(el=>el.onclick=()=>launch(el.dataset.recent))}
function randomGame(){launch(games[Math.floor(Math.random()*games.length)].id)}

$('#searchInput').addEventListener('input',e=>{state.query=e.target.value;renderGames()});
$$('.filter-chip').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter-chip').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.filter=btn.dataset.filter;renderGames()}));
$$('.view-btn').forEach(btn=>{if(btn.dataset.view===state.view){$$('.view-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active')}btn.addEventListener('click',()=>{$$('.view-btn').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.view=btn.dataset.view;save();renderGames()})});
$('#clearRecentBtn').onclick=()=>{state.recent=[];save();renderRecent()};$('#randomGameBtn').onclick=randomGame;$('#heroRandomBtn').onclick=randomGame;
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');const isLight=document.body.classList.contains('light');localStorage.setItem('gu-theme',isLight?'light':'dark');$('#themeBtn').textContent=isLight?'🌙':'☀️'};
if(localStorage.getItem('gu-theme')==='light'){document.body.classList.add('light');$('#themeBtn').textContent='🌙'}
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==$('#searchInput')){e.preventDefault();$('#searchInput').focus();$('#searchInput').scrollIntoView({behavior:'smooth',block:'center'})}if(e.key==='Escape'&&document.activeElement===$('#searchInput')){$('#searchInput').blur()}});
$('#year').textContent=new Date().getFullYear();$('#gameCount').textContent=games.length;
renderGames();renderPopular();renderRecent();
