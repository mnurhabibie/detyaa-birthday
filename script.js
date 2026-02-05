// ===== Stars =====
(function makeStars(){
  const wrap = document.getElementById("stars");
  if(!wrap) return;

  const n = 110;
  for(let i=0;i<n;i++){
    const s = document.createElement("span");
    s.className = "star";

    const x = Math.random()*100;
    const y = Math.random()*70;

    const r = (Math.random()*1.2 + 0.6).toFixed(2) + "px";
    const o = (Math.random()*0.6 + 0.35).toFixed(2);
    const t = (Math.random()*4.3 + 2.2).toFixed(2) + "s";
    const d = (Math.random()*4).toFixed(2) + "s";

    s.style.left = x + "%";
    s.style.top = y + "%";
    s.style.setProperty("--r", r);
    s.style.setProperty("--o", o);
    s.style.setProperty("--t", t);
    s.style.setProperty("--d", d);

    wrap.appendChild(s);
  }
})();

// ===== Fireworks Canvas Engine =====
const canvas = document.getElementById("fx");
const scene = document.getElementById("scene");
const btn = document.getElementById("flameBtn");
const reveal = document.getElementById("reveal");

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ctx = canvas.getContext("2d");
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let particles = [];
let armed = false;
let celebrating = false;
let lastBurst = 0;

function resize(){
  const rect = canvas.getBoundingClientRect();
  dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function rand(min,max){ return Math.random()*(max-min)+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

class Particle{
  constructor(x,y,vx,vy,life,color,size){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.life=life; this.maxLife=life;
    this.color=color; this.size=size;
    this.gravity=0.06;
    this.drag=0.985;
  }
  step(){
    this.vx *= this.drag;
    this.vy = this.vy * this.drag + this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
  }
  alpha(){
    return Math.max(0, Math.min(1, this.life/this.maxLife));
  }
}

function createBurst(x,y,count){
  const palette = ["#ffd166","#ff8fab","#7bdff2","#caffbf","#bdb2ff","#ffadad"];
  const out = [];
  for(let i=0;i<count;i++){
    const a = rand(0, Math.PI*2);
    const speed = rand(1.2, 4.4) * (Math.random()<0.12 ? 1.7 : 1);
    const vx = Math.cos(a) * speed;
    const vy = Math.sin(a) * speed;
    const life = Math.floor(rand(45, 95));
    const size = rand(1.2, 2.6);
    out.push(new Particle(x,y,vx,vy,life,pick(palette),size));
  }
  return out;
}

function burstAt(x,y,intensity=1){
  const rect = canvas.getBoundingClientRect();
  const bx = Math.max(20, Math.min(rect.width-20, x));
  const by = Math.max(20, Math.min(rect.height-160, y));

  const count = Math.floor(70 * intensity);
  particles.push(...createBurst(bx, by, count));
  lastBurst = Date.now();
  celebrating = true;
}

function runShow(){
  armed = true;

  // reveal message
  reveal.classList.add("is-on");

  if(prefersReduced){
    celebrating = false;
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const bursts = [
    {dx:0.25, dy:0.34, i:1.2},
    {dx:0.62, dy:0.28, i:1.1},
    {dx:0.48, dy:0.40, i:1.35},
    {dx:0.35, dy:0.22, i:0.95},
    {dx:0.72, dy:0.38, i:1.0},
  ];

  let k=0;
  const fire = () => {
    const b = bursts[k];
    burstAt(rect.width*b.dx, rect.height*b.dy, b.i);
    k++;
    if(k<bursts.length) setTimeout(fire, 180);
  };
  fire();
}

btn.addEventListener("click", (e) => {
  e.stopPropagation();
  runShow();
});

// click sky for extra bursts after armed
scene.addEventListener("click", (e) => {
  if(!armed || prefersReduced) return;
  const rect = canvas.getBoundingClientRect();
  burstAt(e.clientX - rect.left, e.clientY - rect.top, 0.85);
});

// animation loop
function tick(){
  requestAnimationFrame(tick);

  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;

  ctx.clearRect(0,0,w,h);

  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.step();

    const a = p.alpha();
    if(p.life<=0 || p.x<-50 || p.x>w+50 || p.y>h+80){
      particles.splice(i,1);
      continue;
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if(celebrating && particles.length===0 && Date.now()-lastBurst>900){
    celebrating = false;
  }
}
tick();
