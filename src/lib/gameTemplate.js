// Blank starter template used when a user begins a brand new game.
export const STARTER_GAME_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New Game</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#05060f;color:#e2e8f0;font-family:system-ui,sans-serif}
#c{display:block;width:100%;height:100%}
#t{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;pointer-events:none}
h1{font-size:30px;font-weight:800;background:linear-gradient(90deg,#f472b6,#818cf8);-webkit-background-clip:text;background-clip:text;color:transparent}
p{margin-top:10px;color:#94a3b8;font-size:14px;max-width:420px}
</style></head>
<body>
<canvas id="c"></canvas>
<div id="t"><h1>Your new game</h1><p>This is a blank canvas. Describe the game you want in the chat and it will be built here.</p></div>
<script>
var c=document.getElementById('c'),x=c.getContext('2d'),st=[];
function size(){c.width=innerWidth;c.height=innerHeight;}
size();addEventListener('resize',size);
for(var i=0;i<90;i++)st.push({x:Math.random(),y:Math.random(),r:Math.random()*1.6+0.3,s:Math.random()*0.02+0.004});
function loop(){x.fillStyle='#05060f';x.fillRect(0,0,c.width,c.height);
for(var i=0;i<st.length;i++){var p=st[i];p.y+=p.s*0.01;if(p.y>1)p.y=0;x.globalAlpha=0.5+Math.random()*0.5;x.fillStyle='#c7d2fe';x.beginPath();x.arc(p.x*c.width,p.y*c.height,p.r,0,7);x.fill();}
x.globalAlpha=1;requestAnimationFrame(loop);}
loop();
</script>
</body></html>`;