// The Beast and the Blade — Level 1: Familiar Beast (browser only, no libs)

const CONFIG = {
width: 960,
height: 540,
playerSpeed: 160,
focusBoost: 1.6, // Space key = brief speed boost (her Purpose focus)
focusTime: 0.35,
enemySpeed: 85, // patrollers (old voices)
beastSpeed: 70, // the Familiar Beast slowly chases
fovRadius: 120,
fovAngle: Math.PI/3, // 60°
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let keys = {}, last = 0, over=false, win=false, focusTimer=0;

function v(x=0,y=0){return {x,y}}
function add(a,b){return v(a.x+b.x,a.y+b.y)}
function sub(a,b){return v(a.x-b.x,a.y-b.y)}
function len(a){return Math.hypot(a.x,a.y)}
function norm(a){const L=len(a)||1;return v(a.x/L,a.y/L)}
function scale(a,s){return v(a.x*s,a.y*s)}
function dot(a,b){return a.x*b.x+a.y*b.y}
function rot(a,ang){const c=Math.cos(ang),s=Math.sin(ang);return v(a.x*c-a.y*s,a.x*s+a.y*c)}

const player = { pos:v(120,270), dir:v(0,-1), r:10, color:'#06d6a0' };
const exit = { pos:v(900,270), r:12 };

const enemies = [
{ pos:v(480,140), dir:v(0,1), r:10, wp:[v(480,140), v(480,400)], color:'#ffd166' },
{ pos:v(300,420), dir:v(1,0), r:10, wp:[v(160,420), v(620,420)], color:'#ffd166' },
];

const beast = { pos:v(700,120), dir:v(-1,0), r:16, color:'#ef476f' }; // two-headed vibe later

const walls = [
{x:220,y:80,w:20,h:380},
{x:420,y:0,w:20,h:300},
{x:650,y:240,w:20,h:300},
];

addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true; if(e.key===' ') e.preventDefault(); if(e.key==='r') reset();});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

function reset(){
player.pos=v(120,270); player.dir=v(0,-1);
enemies[0].pos=v(480,140); enemies[0].dir=v(0,1);
enemies[1].pos=v(300,420); enemies[1].dir=v(1,0);
beast.pos=v(700,120); beast.dir=v(-1,0);
focusTimer=0; over=false; win=false;
setStatus("LEVEL 1: Escape the Familiar Beast. Reach the glowing exit without being seen.");
}
function setStatus(t){document.getElementById('status').textContent=t;}

function update(dt){
if(over) return;

// move player
let mv=v(0,0);
if(keys['w']) mv.y-=1;
if(keys['s']) mv.y+=1;
if(keys['a']) mv.x-=1;
if(keys['d']) mv.x+=1;
if(mv.x||mv.y){
mv=norm(mv);
let speed=CONFIG.playerSpeed;
if(keys[' '] && focusTimer<=0){ focusTimer=CONFIG.focusTime; }
if(focusTimer>0){ speed*=CONFIG.focusBoost; focusTimer-=dt; }
player.pos=add(player.pos, scale(mv, speed*dt));
player.dir=mv;
clampPlayer();
}

// enemies patrol
for(const e of enemies){
const wp=e.wp; const target=wp[0]; const t=sub(target,e.pos);
if(len(t)<2){ wp.push(wp.shift()); }
else { const d=norm(t); e.pos=add(e.pos, scale(d, CONFIG.enemySpeed*dt)); e.dir=d; }
}

// beast chases (slow, through the maze)
const toP=norm(sub(player.pos, beast.pos));
beast.pos = add(beast.pos, scale(toP, CONFIG.beastSpeed*dt));
beast.dir = toP;

// detection cones
for(const e of enemies){
if(canSee(e,player)){ lose("Spotted by a patrol. Press R to try again."); return; }
}
if(canSee({pos:beast.pos,dir:beast.dir},player, CONFIG.fovRadius*1.2)){ lose("The Familiar Beast saw you. Press R to try again."); return; }

// win condition: reach exit
if(len(sub(player.pos, exit.pos)) < exit.r+player.r){
win=true; over=true;
setStatus("You escaped the lair. Quest updated: Revisit. Press R to continue.");
}
}

function clampPlayer(){
player.pos.x=Math.max(0,Math.min(CONFIG.width, player.pos.x));
player.pos.y=Math.max(0,Math.min(CONFIG.height, player.pos.y));
}

function canSee(src, obj, radius=CONFIG.fovRadius){
const to=sub(obj.pos, src.pos); const dist=len(to);
if(dist>radius) return false;
const ang=Math.acos(Math.max(-1,Math.min(1,dot(norm(to), src.dir))));
if(ang>CONFIG.fovAngle*0.5) return false;
return !blocked(src.pos, obj.pos);
}

function blocked(a,b){
for(const w of walls){ if(segAABB(a,b,w)) return true; }
return false;
}
function segAABB(a,b,box){
const edges=[
[{x:box.x,y:box.y},{x:box.x+box.w,y:box.y}],
[{x:box.x,y:box.y+box.h},{x:box.x+box.w,y:box.y+box.h}],
[{x:box.x,y:box.y},{x:box.x,y:box.y+box.h}],
[{x:box.x+box.w,y:box.y},{x:box.x+box.w,y:box.y+box.h}],
];
for(const [p1,p2] of edges){ if(segmentsIntersect(a,b,p1,p2)) return true; }
return false;
}
function segmentsIntersect(p,p2,q,q2){
const r=sub(p2,p), s=sub(q2,q);
const rxs = r.x*s.y - r.y*s.x;
const q_p = sub(q,p);
if(rxs===0) return false;
const t = (q_p.x*s.y - q_p.y*s.x)/rxs;
const u = (q_p.x*r.y - q_p.y*r.x)/rxs;
return t>=0 && t<=1 && u>=0 && u<=1;
}

function draw(){
ctx.clearRect(0,0,CONFIG.width,CONFIG.height);
ctx.fillStyle='#0f1118'; ctx.fillRect(0,0,CONFIG.width,CONFIG.height);

// walls
ctx.fillStyle='#2a2d3a';
for(const w of walls){ ctx.fillRect(w.x,w.y,w.w,w.h); }

// exit
ctx.fillStyle='#ef476f';
ctx.beginPath(); ctx.arc(exit.pos.x, exit.pos.y, exit.r, 0, Math.PI*2); ctx.fill();
ctx.font='12px system-ui'; ctx.fillText('EXIT', exit.pos.x-14, exit.pos.y-16);

// FOVs
drawFOV(beast.pos, beast.dir, CONFIG.fovRadius*1.2, 'rgba(239,71,111,0.15)');
for(const e of enemies){ drawFOV(e.pos, e.dir, CONFIG.fovRadius, 'rgba(255,209,102,0.15)'); }

// agents
drawAgent(beast.pos, beast.dir, beast.r, beast.color);
for(const e of enemies){ drawAgent(e.pos, e.dir, e.r, e.color); }
drawAgent(player.pos, player.dir, player.r, player.color);

// banners
if(over && !win) banner("Mission failed. Press R to restart.");
if(win) banner("Escaped! Press R to restart.");
}
function drawAgent(pos,dir,r,color){
ctx.save(); ctx.translate(pos.x,pos.y);
const a=Math.atan2(dir.y,dir.x); ctx.rotate(a+Math.PI/2);
ctx.fillStyle=color;
ctx.beginPath(); ctx.moveTo(0,-r-6); ctx.lineTo(r,r); ctx.lineTo(-r,r); ctx.closePath(); ctx.fill();
ctx.restore();
}
function drawFOV(pos,dir,rad,fill){
ctx.fillStyle=fill; ctx.beginPath(); ctx.moveTo(pos.x,pos.y);
const L=rot(dir,-CONFIG.fovAngle/2), R=rot(dir,CONFIG.fovAngle/2);
ctx.arc(pos.x,pos.y,rad, Math.atan2(L.y,L.x), Math.atan2(R.y,R.x)); ctx.closePath(); ctx.fill();
}
function banner(t){
ctx.fillStyle='rgba(0,0,0,0.6)';
ctx.fillRect(0, canvas.height/2-30, canvas.width, 60);
ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='16px system-ui, Arial';
ctx.fillText(t, canvas.width/2, canvas.height/2+5);
}

function loop(ts){
const dt=Math.min(0.033,(ts-last)/1000); last=ts;
update(dt); draw(); requestAnimationFrame(loop);
}
reset(); requestAnimationFrame(loop);
