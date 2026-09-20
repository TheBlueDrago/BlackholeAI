// A hand-built, self-contained arena shooter: top-down twin-stick combat vs AI bots,
// with wave-based difficulty and full touch controls. No external assets/scripts/network
// calls, matching every other game in Blackhole Games — same convention as gameTemplate.js.
// genre "shooting" + name "veck" resolves to the veck.shooter address via gameDomainOf().
export const VECK_SHOOTER_META = { name: "veck", title: "Veck", genre: "shooting" };

export const VECK_SHOOTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>Veck</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{width:100%;height:100%;overflow:hidden;background:#05060f;font-family:system-ui,-apple-system,sans-serif;touch-action:none}
#c{display:block;width:100%;height:100%;touch-action:none}
.overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;background:radial-gradient(circle at 50% 40%,rgba(99,102,241,.18),rgba(5,6,15,.94) 70%);z-index:20}
.overlay h1{font-size:clamp(32px,8vw,64px);font-weight:900;letter-spacing:1px;background:linear-gradient(90deg,#818cf8,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:10px}
.overlay p{color:#94a3b8;font-size:14px;max-width:420px;margin-bottom:6px;line-height:1.5}
.btn{margin-top:22px;padding:14px 40px;border:none;border-radius:999px;background:linear-gradient(90deg,#6366f1,#d946ef);color:#fff;font-size:18px;font-weight:700;letter-spacing:.5px;cursor:pointer;box-shadow:0 8px 30px rgba(129,140,248,.4)}
.btn:active{transform:scale(.96)}
.hidden{display:none!important}
#hud{position:absolute;top:0;left:0;right:0;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none;z-index:10;font-weight:700;color:#e2e8f0}
#hpwrap{display:flex;flex-direction:column;gap:6px}
#hpbar{width:160px;height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(255,255,255,.15)}
#hpfill{height:100%;background:linear-gradient(90deg,#4ade80,#22d3ee);width:100%}
#lives{font-size:15px;color:#f472b6;letter-spacing:2px}
#stats{text-align:right;font-size:13px;color:#cbd5e1}
#stats b{color:#fff;font-size:16px}
#wave{color:#a5b4fc;font-size:11px;margin-top:2px}
.joy{position:absolute;bottom:26px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.15);z-index:10}
#joyL{left:26px}
#joyR{right:26px}
.joyKnob{position:absolute;width:52px;height:52px;border-radius:50%;background:rgba(129,140,248,.55);border:2px solid rgba(255,255,255,.4);left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none}
</style>
</head>
<body>
<canvas id="c"></canvas>

<div id="hud" class="hidden">
  <div id="hpwrap">
    <div id="hpbar"><div id="hpfill"></div></div>
    <div id="lives"></div>
  </div>
  <div id="stats">
    <div>Kills <b id="kills">0</b></div>
    <div id="wave">Wave 1</div>
  </div>
</div>
<div id="joyL" class="joy hidden"><div class="joyKnob" id="knobL"></div></div>
<div id="joyR" class="joy hidden"><div class="joyKnob" id="knobR"></div></div>

<div id="start" class="overlay">
  <h1>VECK</h1>
  <p>Fight endless waves of bots in a zero-gravity arena. Survive, rack up kills, and watch the wave count climb.</p>
  <p id="ctrlHint" style="color:#818cf8"></p>
  <button class="btn" id="playBtn">PLAY</button>
</div>

<div id="over" class="overlay hidden">
  <h1 style="background:linear-gradient(90deg,#f87171,#f472b6);-webkit-background-clip:text;background-clip:text">GAME OVER</h1>
  <p>You went down with <b id="finalKills" style="color:#fff">0</b> kills.</p>
  <button class="btn" id="againBtn">PLAY AGAIN</button>
</div>

<script>
(function(){
"use strict";
var IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
document.getElementById('ctrlHint').textContent = IS_TOUCH
  ? 'Left stick to move \\u00b7 right stick to aim & fire'
  : 'WASD to move \\u00b7 mouse to aim \\u00b7 click or space to fire';

var c = document.getElementById('c'), x = c.getContext('2d');
function resize(){ c.width = innerWidth; c.height = innerHeight; }
resize(); addEventListener('resize', resize);

var W = 1700, H = 1000;
var OBST = [
  {x:300,y:200,w:160,h:60},{x:1250,y:220,w:160,h:60},
  {x:780,y:120,w:140,h:50},{x:780,y:830,w:140,h:50},
  {x:200,y:700,w:60,h:180},{x:1440,y:650,w:60,h:180},
  {x:600,y:450,w:200,h:40},{x:900,y:520,w:200,h:40}
];

var stars = [];
for (var i=0;i<160;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.3,a:Math.random()});

function circleRectHit(cx,cy,cr,r){
  var nx = Math.max(r.x, Math.min(cx, r.x+r.w));
  var ny = Math.max(r.y, Math.min(cy, r.y+r.h));
  var dx = cx-nx, dy = cy-ny;
  return dx*dx+dy*dy < cr*cr;
}

var keys = {};
addEventListener('keydown', function(e){ keys[e.key.toLowerCase()]=true; if(e.key===' ') e.preventDefault(); });
addEventListener('keyup', function(e){ keys[e.key.toLowerCase()]=false; });

var mouse = {x:innerWidth/2, y:innerHeight/2, down:false};
c.addEventListener('mousemove', function(e){ mouse.x=e.clientX; mouse.y=e.clientY; });
c.addEventListener('mousedown', function(){ mouse.down=true; });
addEventListener('mouseup', function(){ mouse.down=false; });
c.addEventListener('contextmenu', function(e){ e.preventDefault(); });

var joyL = {active:false,id:null,baseX:0,baseY:0,dx:0,dy:0};
var joyR = {active:false,id:null,baseX:0,baseY:0,dx:0,dy:0};
var elJoyL = document.getElementById('joyL'), elJoyR = document.getElementById('joyR');
var elKnobL = document.getElementById('knobL'), elKnobR = document.getElementById('knobR');
if (IS_TOUCH){ elJoyL.classList.remove('hidden'); elJoyR.classList.remove('hidden'); }

function handleTouch(list){
  for (var i=0;i<list.length;i++){
    var t = list[i];
    var j = (t.identifier===joyL.id) ? joyL : (t.identifier===joyR.id) ? joyR : null;
    if (!j) continue;
    var dx = t.clientX - j.baseX, dy = t.clientY - j.baseY;
    var d = Math.hypot(dx,dy), max=50;
    if (d>max){ dx=dx/d*max; dy=dy/d*max; }
    j.dx = dx/max; j.dy = dy/max;
  }
}
addEventListener('touchstart', function(e){
  for (var i=0;i<e.changedTouches.length;i++){
    var t = e.changedTouches[i];
    var isLeft = t.clientX < innerWidth/2;
    var j = isLeft ? joyL : joyR;
    if (j.active) continue;
    j.active = true; j.id = t.identifier; j.baseX = t.clientX; j.baseY = t.clientY; j.dx=0; j.dy=0;
  }
}, {passive:true});
addEventListener('touchmove', function(e){ handleTouch(e.changedTouches); e.preventDefault(); }, {passive:false});
addEventListener('touchend', function(e){
  for (var i=0;i<e.changedTouches.length;i++){
    var t = e.changedTouches[i];
    if (joyL.id===t.identifier){ joyL.active=false; joyL.id=null; joyL.dx=0; joyL.dy=0; }
    if (joyR.id===t.identifier){ joyR.active=false; joyR.id=null; joyR.dx=0; joyR.dy=0; }
  }
}, {passive:true});

function updateKnobs(){
  elKnobL.style.transform = 'translate(calc(-50% + '+(joyL.dx*30)+'px), calc(-50% + '+(joyL.dy*30)+'px))';
  elKnobR.style.transform = 'translate(calc(-50% + '+(joyR.dx*30)+'px), calc(-50% + '+(joyR.dy*30)+'px))';
}

var player, bots, bullets, particles, camera, kills, wave, running, killsForNextWave;

function makePlayer(){ return {x:W/2,y:H/2, angle:0, hp:100, maxHp:100, lives:3, alive:true, invuln:1.5, cooldown:0, r:16}; }
function spawnBot(){
  var edge = Math.floor(Math.random()*4), sx,sy;
  if (edge===0){sx=40;sy=Math.random()*H;} else if(edge===1){sx=W-40;sy=Math.random()*H;}
  else if(edge===2){sx=Math.random()*W;sy=40;} else {sx=Math.random()*W;sy=H-40;}
  return {x:sx,y:sy,angle:0,hp:40+wave*4,maxHp:40+wave*4,alive:true,cooldown:Math.random(),wTimer:0,wDir:Math.random()*Math.PI*2,r:15};
}

function reset(){
  player = makePlayer();
  bots = [];
  for (var i=0;i<3;i++) bots.push(spawnBot());
  bullets = []; particles = [];
  camera = {x:player.x,y:player.y};
  kills = 0; wave = 1; killsForNextWave = 6;
  running = true;
  document.getElementById('kills').textContent = '0';
  document.getElementById('wave').textContent = 'Wave 1';
}

function moveWithCollision(e, dx, dy){
  var nx = e.x+dx, blocked=false, i;
  for (i=0;i<OBST.length;i++) if (circleRectHit(nx,e.y,e.r,OBST[i])) { blocked=true; break; }
  if (!blocked) e.x = Math.max(e.r, Math.min(W-e.r, nx));
  var ny = e.y+dy; blocked=false;
  for (i=0;i<OBST.length;i++) if (circleRectHit(e.x,ny,e.r,OBST[i])) { blocked=true; break; }
  if (!blocked) e.y = Math.max(e.r, Math.min(H-e.r, ny));
}

function fire(owner, x0,y0, angle){
  bullets.push({x:x0,y:y0,vx:Math.cos(angle)*640,vy:Math.sin(angle)*640,owner:owner,life:1.1});
  for (var i=0;i<6;i++) particles.push({x:x0,y:y0,vx:Math.cos(angle)*(80+Math.random()*80)+((Math.random()-.5)*60),vy:Math.sin(angle)*(80+Math.random()*80)+((Math.random()-.5)*60),life:.25,color: owner==='player' ? '#a5b4fc' : '#fb7185'});
}

function hurtPlayer(dmg){
  if (player.invuln>0 || !player.alive) return;
  player.hp -= dmg;
  if (player.hp<=0){
    player.alive = false; player.lives--;
    for (var i=0;i<24;i++) particles.push({x:player.x,y:player.y,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,life:.6,color:'#818cf8'});
    if (player.lives<=0){ endGame(); }
    else setTimeout(function(){ player.x=W/2;player.y=H/2;player.hp=player.maxHp;player.alive=true;player.invuln=2; }, 1200);
  }
}

function killBot(b){
  b.alive=false; kills++;
  document.getElementById('kills').textContent = kills;
  for (var i=0;i<18;i++) particles.push({x:b.x,y:b.y,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*260,life:.5,color:'#fb7185'});
  if (kills>=killsForNextWave){
    wave++; killsForNextWave += 6+wave*2;
    document.getElementById('wave').textContent='Wave '+wave;
    if (bots.filter(function(b2){return b2.alive;}).length < Math.min(3+wave,9)) setTimeout(function(){bots.push(spawnBot());}, 400);
  }
  setTimeout(function(){
    var nb = spawnBot();
    b.x=nb.x;b.y=nb.y;b.hp=nb.hp;b.maxHp=nb.maxHp;b.alive=true;b.wTimer=0;
  }, 1800);
}

function endGame(){
  running = false;
  document.getElementById('finalKills').textContent = kills;
  document.getElementById('over').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
}

function update(dt){
  updateKnobs();
  var mx=0,my=0;
  if (IS_TOUCH){ mx=joyL.dx; my=joyL.dy; }
  else { if(keys.w||keys.arrowup) my-=1; if(keys.s||keys.arrowdown) my+=1; if(keys.a||keys.arrowleft) mx-=1; if(keys.d||keys.arrowright) mx+=1; }
  var mlen = Math.hypot(mx,my); if (mlen>1){mx/=mlen;my/=mlen;}
  if (player.alive){
    moveWithCollision(player, mx*260*dt, my*260*dt);
    if (IS_TOUCH){
      if (Math.hypot(joyR.dx,joyR.dy) > .25) player.angle = Math.atan2(joyR.dy, joyR.dx);
    } else {
      player.angle = Math.atan2(mouse.y - (player.y-camera.y+innerHeight/2), mouse.x - (player.x-camera.x+innerWidth/2));
    }
    player.cooldown -= dt;
    var wantFire = IS_TOUCH ? Math.hypot(joyR.dx,joyR.dy) > .25 : (mouse.down || keys[' ']);
    if (wantFire && player.cooldown<=0){
      player.cooldown = .18;
      fire('player', player.x+Math.cos(player.angle)*20, player.y+Math.sin(player.angle)*20, player.angle);
    }
    if (player.invuln>0) player.invuln -= dt;
  }
  camera.x += (player.x-camera.x)*Math.min(1,dt*6);
  camera.y += (player.y-camera.y)*Math.min(1,dt*6);

  bots.forEach(function(b){
    if (!b.alive) return;
    var dx=player.x-b.x, dy=player.y-b.y, dist=Math.hypot(dx,dy);
    if (player.alive && dist < 420){
      b.angle=Math.atan2(dy,dx);
      var dir = dist>180 ? 1 : (dist<120 ? -1 : 0);
      moveWithCollision(b, Math.cos(b.angle)*dir*140*dt, Math.sin(b.angle)*dir*140*dt);
      b.cooldown -= dt;
      if (b.cooldown<=0 && dist<420){
        b.cooldown = .9 - Math.min(.5, wave*.04);
        var spread = (Math.random()-.5)*.18;
        fire('bot', b.x+Math.cos(b.angle)*18, b.y+Math.sin(b.angle)*18, b.angle+spread);
      }
    } else {
      b.wTimer -= dt;
      if (b.wTimer<=0){ b.wDir = Math.random()*Math.PI*2; b.wTimer = 1+Math.random()*2; }
      b.angle = b.wDir;
      moveWithCollision(b, Math.cos(b.wDir)*70*dt, Math.sin(b.wDir)*70*dt);
    }
  });

  bullets.forEach(function(bl){ bl.x += bl.vx*dt; bl.y += bl.vy*dt; bl.life -= dt; });
  bullets = bullets.filter(function(bl){
    if (bl.life<=0 || bl.x<0||bl.x>W||bl.y<0||bl.y>H) return false;
    for (var i=0;i<OBST.length;i++) if (circleRectHit(bl.x,bl.y,3,OBST[i])) return false;
    if (bl.owner==='player'){
      for (var j=0;j<bots.length;j++){
        var b = bots[j];
        if (b.alive && Math.hypot(bl.x-b.x,bl.y-b.y) < b.r){
          b.hp -= 18;
          if (b.hp<=0) killBot(b);
          return false;
        }
      }
    } else if (player.alive && Math.hypot(bl.x-player.x,bl.y-player.y) < player.r){
      hurtPlayer(14);
      return false;
    }
    return true;
  });

  particles.forEach(function(p){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; p.vx*=0.9; p.vy*=0.9; });
  particles = particles.filter(function(p){ return p.life>0; });

  document.getElementById('hpfill').style.width = Math.max(0,player.hp/player.maxHp*100)+'%';
  document.getElementById('lives').textContent = '\\u2665'.repeat(Math.max(0,player.lives));
}

function drawShip(px,py,angle,fill,glow){
  x.save();
  x.translate(px,py); x.rotate(angle);
  x.shadowColor = glow; x.shadowBlur = 14;
  x.fillStyle = fill;
  x.beginPath();
  x.moveTo(18,0); x.lineTo(-12,10); x.lineTo(-6,0); x.lineTo(-12,-10);
  x.closePath(); x.fill();
  x.restore();
}

function render(){
  x.fillStyle = '#05060f'; x.fillRect(0,0,c.width,c.height);
  var ox = c.width/2 - camera.x, oy = c.height/2 - camera.y;

  stars.forEach(function(s){
    var sx = s.x+ox, sy = s.y+oy;
    x.globalAlpha = 0.3+Math.sin(performance.now()/600+s.a*10)*0.2+0.3;
    x.fillStyle = '#c7d2fe';
    x.beginPath(); x.arc(sx,sy,s.r,0,7); x.fill();
  });
  x.globalAlpha = 1;

  x.save();
  x.translate(ox,oy);
  x.strokeStyle = 'rgba(129,140,248,.35)'; x.lineWidth=4;
  x.strokeRect(0,0,W,H);
  x.fillStyle = 'rgba(129,140,248,.03)';
  x.fillRect(0,0,W,H);

  x.strokeStyle = 'rgba(148,163,184,.06)'; x.lineWidth=1;
  for (var gx=0; gx<=W; gx+=100){ x.beginPath(); x.moveTo(gx,0); x.lineTo(gx,H); x.stroke(); }
  for (var gy=0; gy<=H; gy+=100){ x.beginPath(); x.moveTo(0,gy); x.lineTo(W,gy); x.stroke(); }

  OBST.forEach(function(o){
    x.fillStyle = 'rgba(100,116,139,.35)';
    x.strokeStyle = 'rgba(148,163,184,.5)'; x.lineWidth=2;
    x.fillRect(o.x,o.y,o.w,o.h); x.strokeRect(o.x,o.y,o.w,o.h);
  });

  bullets.forEach(function(bl){
    x.fillStyle = bl.owner==='player' ? '#a5b4fc' : '#fb7185';
    x.beginPath(); x.arc(bl.x,bl.y,4,0,7); x.fill();
  });

  particles.forEach(function(p){
    x.globalAlpha = Math.max(0,p.life*2);
    x.fillStyle = p.color;
    x.beginPath(); x.arc(p.x,p.y,3,0,7); x.fill();
  });
  x.globalAlpha=1;

  bots.forEach(function(b){
    if (!b.alive) return;
    drawShip(b.x,b.y,b.angle,'#fb7185','#f472b6');
    x.fillStyle='rgba(0,0,0,.5)'; x.fillRect(b.x-18,b.y-30,36,5);
    x.fillStyle='#fb7185'; x.fillRect(b.x-18,b.y-30,36*Math.max(0,b.hp/b.maxHp),5);
  });

  if (player.alive){
    x.globalAlpha = player.invuln>0 ? (0.5+0.5*Math.sin(performance.now()/60)) : 1;
    drawShip(player.x,player.y,player.angle,'#818cf8','#c7d2fe');
    x.globalAlpha=1;
  }

  x.restore();
}

var last = performance.now();
function loop(now){
  var dt = Math.min(.05, (now-last)/1000); last = now;
  if (running) update(dt);
  render();
  requestAnimationFrame(loop);
}

document.getElementById('playBtn').addEventListener('click', function(){
  document.getElementById('start').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  reset();
});
document.getElementById('againBtn').addEventListener('click', function(){
  document.getElementById('over').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  reset();
});

reset(); running=false;
requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
