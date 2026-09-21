// A hand-built, self-contained auto-runner: single-tap cube jumping over spikes and
// gaps, with glowing portals that switch the player into a fly-by-holding "ship" mode
// for a stretch of each level, across seven hand-tuned levels. Same style/conventions
// as veckShooterGame.js — no external assets/scripts/network calls, original art.
// genre "arcade" + name "pulse" resolves to the pulse.arcade address via gameDomainOf().
export const PULSE_JUMP_META = { name: "pulse", title: "Pulse Jump", genre: "arcade" };

export const PULSE_JUMP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Pulse Jump</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{width:100%;height:100%;overflow:hidden;background:#05060f;font-family:system-ui,-apple-system,sans-serif;touch-action:none}
#c{display:block;width:100%;height:100%;touch-action:none}
.overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:radial-gradient(circle at 50% 40%,rgba(99,102,241,.18),rgba(5,6,15,.94) 70%);z-index:20;overflow-y:auto}
.overlay h1{font-size:clamp(30px,7vw,56px);font-weight:900;letter-spacing:1px;background:linear-gradient(90deg,#818cf8,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:10px}
.overlay p{color:#94a3b8;font-size:14px;max-width:440px;margin-bottom:6px;line-height:1.5}
.btn{margin-top:16px;padding:14px 40px;border:none;border-radius:999px;background:linear-gradient(90deg,#6366f1,#d946ef);color:#fff;font-size:18px;font-weight:700;letter-spacing:.5px;cursor:pointer;box-shadow:0 8px 30px rgba(129,140,248,.4)}
.btn:active{transform:scale(.96)}
.btn.ghost{background:rgba(255,255,255,.08);box-shadow:none;border:1px solid rgba(255,255,255,.18)}
.hidden{display:none!important}
#hud{position:absolute;top:0;left:0;right:0;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:10;font-weight:700;color:#e2e8f0}
#hud .lvl{font-size:13px;color:#a5b4fc}
#hud .att{font-size:12px;color:#64748b;margin-top:2px}
#modeTag{font-size:11px;color:#22d3ee;margin-top:2px;letter-spacing:1px}
#pbarWrap{position:absolute;top:0;left:0;right:0;height:6px;background:rgba(255,255,255,.08);z-index:10}
#pbarFill{height:100%;width:0%;background:linear-gradient(90deg,#818cf8,#f472b6)}
.levels{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:18px;max-width:520px}
.lvlBtn{padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#e2e8f0;font-weight:700;font-size:12px;cursor:pointer;min-width:100px}
.lvlBtn.locked{opacity:.35;cursor:not-allowed}
.lvlBtn b{display:block;font-size:10px;font-weight:600;color:#94a3b8;margin-top:3px}
</style>
</head>
<body>
<canvas id="c"></canvas>

<div id="pbarWrap" class="hidden"><div id="pbarFill"></div></div>
<div id="hud" class="hidden">
  <div>
    <div class="lvl" id="lvlName">Level 1</div>
    <div id="modeTag">CUBE</div>
  </div>
  <div class="att" id="attempts">Attempt 1</div>
</div>

<div id="start" class="overlay">
  <h1>PULSE JUMP</h1>
  <p>Tap, click, or press space to jump. Fly through a glowing portal and hold to pilot a ship through the gauntlet, then land back in cube mode on the way out. One hit sends you back to the start of the level.</p>
  <div class="levels" id="levelPicker"></div>
</div>

<div id="dead" class="overlay hidden">
  <h1 style="background:linear-gradient(90deg,#f87171,#f472b6);-webkit-background-clip:text;background-clip:text">CRASHED</h1>
  <p><span id="deadPct" style="color:#fff;font-weight:700">0%</span> of the level.</p>
  <button class="btn" id="retryBtn">RETRY</button>
  <button class="btn ghost" id="menuBtn1">LEVEL SELECT</button>
</div>

<div id="won" class="overlay hidden">
  <h1 style="background:linear-gradient(90deg,#4ade80,#22d3ee);-webkit-background-clip:text;background-clip:text">LEVEL COMPLETE</h1>
  <p>Finished in <span id="wonAttempts" style="color:#fff;font-weight:700">1</span> attempt(s).</p>
  <button class="btn" id="nextBtn">NEXT LEVEL</button>
  <button class="btn ghost" id="menuBtn2">LEVEL SELECT</button>
</div>

<script>
(function(){
"use strict";
var c = document.getElementById('c'), x = c.getContext('2d');
function resize(){ c.width = innerWidth; c.height = innerHeight; }
resize(); addEventListener('resize', resize);

var GRAV = 2600;
var JUMP_V = 900;
var PAD_V = 1300;
var PLAYER_SIZE = 38;
var SHIP_ACCEL = 2200;
var SHIP_GRAV = 1900;
var SHIP_MAX_V = 620;
var CEIL_OFFSET = 430;

function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jumpSpan(speed){ return speed * (2*Math.abs(JUMP_V)/GRAV); }

function generateLevel(seed, speed, length, density){
  var rnd = mulberry32(seed);
  var obstacles = [];
  var safeSpan = jumpSpan(speed);
  var x0 = 900;
  while (x0 < length - 700){
    var reactionGap = speed * (0.55 - density*0.08);
    x0 += reactionGap + rnd()*reactionGap*0.6;
    var roll = rnd();
    if (roll < 0.4){
      var spikes = 1 + Math.floor(rnd()*Math.min(3, 1+Math.floor(density*3)));
      var w = spikes*34;
      if (w > safeSpan*0.55) { spikes = 1; w = 34; }
      obstacles.push({ x:x0, type:'spike', w:w, n:spikes });
      x0 += w;
    } else if (roll < 0.7){
      var gw = Math.min(safeSpan*0.55, 90 + rnd()*70*density);
      obstacles.push({ x:x0, type:'gap', w:gw });
      x0 += gw;
    } else if (roll < 0.85){
      obstacles.push({ x:x0, type:'pad', w:34 });
      x0 += 34;
    } else {
      var w2 = 34;
      obstacles.push({ x:x0, type:'spike', w:w2, n:1 });
      x0 += w2;
    }
  }
  return obstacles;
}

function generateShipSegment(rnd, xStart, xEnd, speed){
  var obstacles = [];
  var x0 = xStart + 260;
  while (true){
    var reactionGap = speed*0.85;
    var nx = x0 + reactionGap + rnd()*reactionGap*0.4;
    if (nx > xEnd - 260) break;
    x0 = nx;
    var top = rnd() < 0.5;
    var h = 120 + rnd()*50;
    obstacles.push({ x:x0, type: top ? 'spikeTop' : 'spike', w:40, h:h });
    x0 += 40;
  }
  return obstacles;
}

function buildLevel(lv){
  var cubeObstacles = generateLevel(lv.seed, lv.speed, lv.length, lv.density);
  var portals = [];
  var shipObstacles = [];
  if (lv.shipWindows){
    var rnd2 = mulberry32(lv.seed + 777);
    lv.shipWindows.forEach(function(w){
      var xs = lv.length*w.start, xe = lv.length*w.end;
      cubeObstacles = cubeObstacles.filter(function(o){ return o.x < xs-150 || o.x > xe+150; });
      portals.push({ x:xs, toMode:'ship', crossed:false });
      portals.push({ x:xe, toMode:'cube', crossed:false });
      shipObstacles = shipObstacles.concat(generateShipSegment(rnd2, xs, xe, lv.speed));
    });
  }
  lv.obstacles = cubeObstacles.concat(shipObstacles);
  lv.portals = portals;
}

var LEVELS = [
  { name:'Ignition', color:['#818cf8','#f472b6'], speed:380, length:5200, density:0.35, seed:11 },
  { name:'Overdrive', color:['#22d3ee','#818cf8'], speed:440, length:6200, density:0.55, seed:42 },
  { name:'Fracture', color:['#f472b6','#fb923c'], speed:500, length:7200, density:0.75, seed:77 },
  { name:'Wormhole', color:['#22d3ee','#a855f7'], speed:520, length:7600, density:0.6, seed:15, shipWindows:[{start:0.35,end:0.55}] },
  { name:'Singularity', color:['#a855f7','#22d3ee'], speed:560, length:8400, density:0.85, seed:9, shipWindows:[{start:0.4,end:0.58}] },
  { name:'Eclipse', color:['#f472b6','#22d3ee'], speed:600, length:9200, density:0.8, seed:33, shipWindows:[{start:0.22,end:0.38},{start:0.62,end:0.78}] },
  { name:'Nova', color:['#fb923c','#a855f7'], speed:640, length:10200, density:0.9, seed:5, shipWindows:[{start:0.18,end:0.32},{start:0.48,end:0.62},{start:0.76,end:0.9}] },
];
LEVELS.forEach(buildLevel);

var PROGRESS_KEY = 'pulse-jump-progress';
function getUnlocked(){
  try { return Math.max(1, parseInt(localStorage.getItem(PROGRESS_KEY) || '1', 10)); } catch(e){ return 1; }
}
function setUnlocked(n){
  try { localStorage.setItem(PROGRESS_KEY, String(n)); } catch(e){}
}

var state = 'menu';
var curLevel = 0;
var attempts = 1;
var player, scrollX, particles;

function resetRun(lv){
  player = { y:0, vy:0, airborne:false, rot:0, alive:true, mode:'cube', falling:false };
  scrollX = 0;
  particles = [];
  lv.portals.forEach(function(p){ p.crossed = false; });
  document.getElementById('modeTag').textContent = 'CUBE';
}

function startLevel(idx){
  curLevel = idx;
  attempts = 1;
  resetRun(LEVELS[idx]);
  state = 'play';
  document.getElementById('start').classList.add('hidden');
  document.getElementById('dead').classList.add('hidden');
  document.getElementById('won').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('pbarWrap').classList.remove('hidden');
  document.getElementById('lvlName').textContent = LEVELS[idx].name;
  document.getElementById('attempts').textContent = 'Attempt ' + attempts;
}

function retryLevel(){
  attempts++;
  resetRun(LEVELS[curLevel]);
  state = 'play';
  document.getElementById('dead').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('pbarWrap').classList.remove('hidden');
  document.getElementById('attempts').textContent = 'Attempt ' + attempts;
}

function crash(){
  state = 'dead';
  player.alive = false;
  for (var i=0;i<20;i++) particles.push({ x: playerScreenX(), y: groundYScreen()-PLAYER_SIZE/2-player.y, vx:(Math.random()-.5)*300, vy:-Math.random()*260, life:.6, color: Math.random()<.5?'#f472b6':'#818cf8' });
  var pct = Math.min(100, Math.floor(scrollX/LEVELS[curLevel].length*100));
  document.getElementById('deadPct').textContent = pct + '%';
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pbarWrap').classList.add('hidden');
  setTimeout(function(){ document.getElementById('dead').classList.remove('hidden'); }, 350);
}

function win(){
  state = 'won';
  var unlocked = getUnlocked();
  if (curLevel+2 > unlocked) setUnlocked(curLevel+2);
  document.getElementById('wonAttempts').textContent = attempts;
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pbarWrap').classList.add('hidden');
  document.getElementById('won').classList.remove('hidden');
}

function playerScreenX(){ return Math.min(innerWidth*0.22, 150); }
function groundYScreen(){ return innerHeight*0.72; }

function obstaclesNear(){
  var lv = LEVELS[curLevel];
  return lv.obstacles.filter(function(o){ return o.x > scrollX-100 && o.x < scrollX+innerWidth+100; });
}

function groundSolidAt(wx){
  var lv = LEVELS[curLevel];
  for (var i=0;i<lv.obstacles.length;i++){
    var o = lv.obstacles[i];
    if (o.type==='gap' && wx >= o.x && wx <= o.x+o.w) return false;
  }
  return true;
}
function padAt(wx){
  var lv = LEVELS[curLevel];
  for (var i=0;i<lv.obstacles.length;i++){
    var o = lv.obstacles[i];
    if (o.type==='pad' && wx >= o.x-4 && wx <= o.x+o.w+4) return true;
  }
  return false;
}
function hazardHit(wx){
  var lv = LEVELS[curLevel];
  var half = PLAYER_SIZE*0.32;
  for (var i=0;i<lv.obstacles.length;i++){
    var o = lv.obstacles[i];
    if (wx+half <= o.x || wx-half >= o.x+o.w) continue;
    if (o.type==='spike'){
      if (player.mode==='cube'){ if (player.y < 6) return true; }
      else if (player.y < (o.h||0)) return true;
    } else if (o.type==='spikeTop'){
      if (player.mode==='ship' && player.y > CEIL_OFFSET-(o.h||0)) return true;
    }
  }
  return false;
}

function doJump(){
  if (state !== 'play' || !player.alive || player.mode !== 'cube') return;
  if (!player.airborne){
    player.vy = JUMP_V;
    player.airborne = true;
  }
}

var holding = false;
function pressStart(){
  holding = true;
  if (player && player.mode==='cube') doJump();
}
function pressEnd(){ holding = false; }
addEventListener('keydown', function(e){
  if (e.key===' ' || e.key==='ArrowUp') e.preventDefault();
  if ((e.key===' ' || e.key==='ArrowUp' || e.key==='w') && !holding) pressStart();
});
addEventListener('keyup', function(e){ if (e.key===' '||e.key==='ArrowUp'||e.key==='w') pressEnd(); });
c.addEventListener('mousedown', pressStart);
addEventListener('mouseup', pressEnd);
c.addEventListener('touchstart', function(e){ e.preventDefault(); pressStart(); }, {passive:false});
addEventListener('touchend', pressEnd, {passive:true});

function update(dt){
  var lv = LEVELS[curLevel];
  scrollX += lv.speed*dt;
  var worldX = scrollX + PLAYER_SIZE*0.5;

  lv.portals.forEach(function(p){
    if (!p.crossed && worldX >= p.x){
      p.crossed = true;
      player.mode = p.toMode;
      document.getElementById('modeTag').textContent = p.toMode === 'ship' ? 'SHIP' : 'CUBE';
      if (p.toMode === 'ship'){ player.y = CEIL_OFFSET*0.5; player.vy = 0; player.airborne = true; player.falling = false; }
      else { player.y = 0; player.vy = 0; player.airborne = false; player.falling = false; }
    }
  });

  if (player.mode === 'cube'){
    player.vy -= GRAV*dt;
    player.y += player.vy*dt;
    if (player.falling){
      if (player.y < -160){ crash(); return; }
    } else if (player.y <= 0){
      if (groundSolidAt(worldX)){
        player.y = 0; player.vy = 0;
        if (player.airborne){ player.rot = Math.round(player.rot/90)*90; }
        player.airborne = false;
        if (padAt(worldX)){ player.vy = PAD_V; player.airborne = true; }
      } else {
        player.falling = true;
      }
    } else {
      player.airborne = true;
    }
    if (player.airborne) player.rot += dt*480;
  } else {
    if (holding) player.vy += SHIP_ACCEL*dt; else player.vy -= SHIP_GRAV*dt;
    player.vy = Math.max(-SHIP_MAX_V, Math.min(SHIP_MAX_V, player.vy));
    player.y += player.vy*dt;
    if (player.y < 0){ player.y = 0; player.vy = Math.max(0, player.vy); }
    if (player.y > CEIL_OFFSET){ player.y = CEIL_OFFSET; player.vy = Math.min(0, player.vy); }
    player.rot = Math.max(-25, Math.min(25, -player.vy/SHIP_MAX_V*25));
  }

  if (hazardHit(worldX)){ crash(); return; }

  document.getElementById('pbarFill').style.width = Math.min(100, scrollX/lv.length*100) + '%';
  if (scrollX >= lv.length){ win(); return; }

  particles.forEach(function(p){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=GRAV*dt*0.3; p.life-=dt; });
  particles = particles.filter(function(p){ return p.life>0; });
}

function drawSpike(sx, gy, w, n){
  var seg = w/n;
  for (var i=0;i<n;i++){
    var cx = sx + seg*i + seg/2;
    x.beginPath();
    x.moveTo(cx-seg*0.48, gy);
    x.lineTo(cx, gy-seg*1.5);
    x.lineTo(cx+seg*0.48, gy);
    x.closePath();
    x.fillStyle = 'rgba(251,113,133,.85)';
    x.shadowColor = '#f472b6'; x.shadowBlur = 12;
    x.fill();
    x.shadowBlur = 0;
  }
}
function drawFloorSpikeH(sx, gy, w, h){
  x.beginPath();
  x.moveTo(sx-w*0.48, gy); x.lineTo(sx, gy-h); x.lineTo(sx+w*0.48, gy);
  x.closePath();
  x.fillStyle = 'rgba(251,113,133,.85)'; x.shadowColor = '#f472b6'; x.shadowBlur = 12;
  x.fill(); x.shadowBlur = 0;
}
function drawSpikeTop(sx, gy, w, h){
  var cy = gy - CEIL_OFFSET;
  x.beginPath();
  x.moveTo(sx-w*0.48, cy); x.lineTo(sx, cy+h); x.lineTo(sx+w*0.48, cy);
  x.closePath();
  x.fillStyle = 'rgba(129,140,248,.85)'; x.shadowColor = '#818cf8'; x.shadowBlur = 12;
  x.fill(); x.shadowBlur = 0;
}

function render(){
  var lv = LEVELS[curLevel] || LEVELS[0];
  var grad = x.createLinearGradient(0,0,0,c.height);
  grad.addColorStop(0,'#05060f'); grad.addColorStop(1,'#0b0f1e');
  x.fillStyle = grad; x.fillRect(0,0,c.width,c.height);

  var gy = groundYScreen();
  x.strokeStyle = 'rgba(148,163,184,.08)'; x.lineWidth=1;
  var gridOff = -(scrollX%80);
  for (var gx=gridOff; gx<c.width; gx+=80){ x.beginPath(); x.moveTo(gx,0); x.lineTo(gx,c.height); x.stroke(); }

  if (state==='play' || state==='dead'){
    var px0 = playerScreenX();
    var obs = obstaclesNear();

    if (player.mode === 'ship'){
      x.strokeStyle = 'rgba(129,140,248,.4)'; x.lineWidth=3; x.shadowColor='#818cf8'; x.shadowBlur=8;
      x.beginPath(); x.moveTo(0, gy-CEIL_OFFSET); x.lineTo(c.width, gy-CEIL_OFFSET); x.stroke();
      x.shadowBlur=0;
    }

    x.strokeStyle = lv.color[0]; x.lineWidth=3; x.shadowColor=lv.color[0]; x.shadowBlur=10;
    var segStart = null;
    for (var sx0=-50; sx0<c.width+50; sx0+=6){
      var wx = scrollX - px0 + sx0;
      var solid = groundSolidAt(wx);
      if (solid && segStart===null) segStart = sx0;
      if (!solid && segStart!==null){ x.beginPath(); x.moveTo(segStart,gy); x.lineTo(sx0,gy); x.stroke(); segStart=null; }
    }
    if (segStart!==null){ x.beginPath(); x.moveTo(segStart,gy); x.lineTo(c.width+50,gy); x.stroke(); }
    x.shadowBlur=0;

    lv.portals.forEach(function(p){
      var screenX = p.x - scrollX + px0;
      if (screenX < -60 || screenX > c.width+60) return;
      var col = p.toMode==='ship' ? '#22d3ee' : '#f472b6';
      x.strokeStyle = col; x.lineWidth = 6; x.shadowColor = col; x.shadowBlur = 20;
      x.beginPath(); x.moveTo(screenX, gy-CEIL_OFFSET*0.6); x.lineTo(screenX, gy+16); x.stroke();
      x.shadowBlur=0;
    });

    obs.forEach(function(o){
      var screenX = o.x - scrollX + px0;
      if (o.type==='spike'){
        if (o.h) drawFloorSpikeH(screenX, gy, o.w, o.h);
        else drawSpike(screenX, gy, o.w, o.n||1);
      } else if (o.type==='spikeTop'){
        drawSpikeTop(screenX, gy, o.w, o.h);
      } else if (o.type==='pad'){
        x.fillStyle='#fb923c'; x.shadowColor='#fb923c'; x.shadowBlur=14;
        x.fillRect(screenX, gy-8, o.w, 8);
        x.shadowBlur=0;
      }
    });

    if (player.alive || state==='dead'){
      x.save();
      var py = gy - PLAYER_SIZE/2 - player.y;
      x.translate(px0+PLAYER_SIZE/2, py);
      x.rotate(player.rot*Math.PI/180);
      var pgrad = x.createLinearGradient(-PLAYER_SIZE/2,-PLAYER_SIZE/2,PLAYER_SIZE/2,PLAYER_SIZE/2);
      pgrad.addColorStop(0, lv.color[0]); pgrad.addColorStop(1, lv.color[1]);
      x.fillStyle = pgrad;
      x.shadowColor = lv.color[1]; x.shadowBlur = 16;
      if (player.mode === 'ship'){
        x.beginPath();
        x.moveTo(PLAYER_SIZE*0.65,0);
        x.lineTo(-PLAYER_SIZE*0.5,PLAYER_SIZE*0.42);
        x.lineTo(-PLAYER_SIZE*0.22,0);
        x.lineTo(-PLAYER_SIZE*0.5,-PLAYER_SIZE*0.42);
        x.closePath(); x.fill();
      } else {
        x.fillRect(-PLAYER_SIZE/2,-PLAYER_SIZE/2,PLAYER_SIZE,PLAYER_SIZE);
      }
      x.shadowBlur=0;
      x.restore();
    }

    particles.forEach(function(p){
      x.globalAlpha = Math.max(0,p.life*1.6);
      x.fillStyle = p.color;
      x.fillRect(p.x-3,p.y-3,6,6);
    });
    x.globalAlpha=1;
  }
}

var last = performance.now();
function loop(now){
  var dt = Math.min(.033, (now-last)/1000); last = now;
  if (state==='play') update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function buildLevelPicker(){
  var wrap = document.getElementById('levelPicker');
  wrap.innerHTML = '';
  var unlocked = getUnlocked();
  LEVELS.forEach(function(lv, i){
    var b = document.createElement('button');
    var locked = i+1 > unlocked;
    b.className = 'lvlBtn' + (locked ? ' locked' : '');
    b.innerHTML = lv.name + '<b>' + (locked ? 'LOCKED' : (lv.shipWindows ? 'Lvl ' + (i+1) + ' \\u00b7 Ship' : 'Level ' + (i+1))) + '</b>';
    if (!locked) b.addEventListener('click', function(){ startLevel(i); });
    wrap.appendChild(b);
  });
}

document.getElementById('retryBtn').addEventListener('click', retryLevel);
document.getElementById('menuBtn1').addEventListener('click', function(){
  state='menu';
  document.getElementById('dead').classList.add('hidden');
  document.getElementById('start').classList.remove('hidden');
  buildLevelPicker();
});
document.getElementById('nextBtn').addEventListener('click', function(){
  var next = curLevel+1;
  if (next < LEVELS.length) startLevel(next);
  else { state='menu'; document.getElementById('won').classList.add('hidden'); document.getElementById('start').classList.remove('hidden'); buildLevelPicker(); }
});
document.getElementById('menuBtn2').addEventListener('click', function(){
  state='menu';
  document.getElementById('won').classList.add('hidden');
  document.getElementById('start').classList.remove('hidden');
  buildLevelPicker();
});

buildLevelPicker();
})();
</script>
</body>
</html>`;
