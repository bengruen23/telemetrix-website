/* ----------------------------------------------------
   0. FLUID CURSOR & MAGNETIC UI (Dennis Snellenberg Style)
---------------------------------------------------- */
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let outlinePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Smooth Lerp for Cursor Outline
function renderCursor() {
  cursorDot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
  
  // Easing factor for the trailing outline
  outlinePos.x += (mouse.x - outlinePos.x) * 0.15;
  outlinePos.y += (mouse.y - outlinePos.y) * 0.15;
  cursorOutline.style.transform = `translate(${outlinePos.x}px, ${outlinePos.y}px)`;
  
  requestAnimationFrame(renderCursor);
}
renderCursor();

// Add hover states for interactive elements
document.querySelectorAll('a, button, .interactive-hover').forEach(el => {
  el.addEventListener('mouseenter', () => cursorOutline.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => cursorOutline.classList.remove('cursor-hover'));
});

// Magnetic Buttons Physics
document.querySelectorAll('.magnetic, .magnetic-strong, .magnetic-soft').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const h = rect.width / 2;
    
    const x = e.clientX - rect.left - h;
    const y = e.clientY - rect.top - h;
    
    let pull = btn.classList.contains('magnetic-strong') ? 0.6 : 
               btn.classList.contains('magnetic-soft') ? 0.2 : 0.4;

    gsap.to(btn, { x: x * pull, y: y * pull, duration: 0.3, ease: "power2.out" });
  });
  
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
  });
});


/* ----------------------------------------------------
   1. KINETIC TEXT ANIMATION
---------------------------------------------------- */
const textWrapper = document.querySelector('#hero-title');
if (textWrapper) {
  const words = textWrapper.textContent.trim().split(' ');
  textWrapper.innerHTML = '';
  words.forEach(word => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';
    wordSpan.innerHTML = word.replace(/\S/g, "<span class='char'>$&</span>");
    textWrapper.appendChild(wordSpan);
  });

  anime.timeline({ loop: false })
    .add({ targets: '.el-eyebrow', opacity: [0, 1], translateY: [10, 0], easing: "easeOutExpo", duration: 1000, delay: 200 })
    .add({ targets: '.char', translateY: ["100%", "0%"], opacity: [0, 1], easing: "easeOutExpo", duration: 1200, delay: (el, i) => 15 * i }, "-=600")
    .add({ targets: '.el-sub', opacity: [0, 1], translateY: [20, 0], easing: "easeOutExpo", duration: 1000 }, "-=800")
    .add({ targets: '.el-actions', opacity: [0, 1], translateY: [20, 0], easing: "easeOutExpo", duration: 1000 }, "-=800");
}

gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray('.gs-fade').forEach(element => {
  gsap.from(element, { scrollTrigger: { trigger: element, start: "top 85%" }, y: 40, opacity: 0, duration: 1.2, ease: "power3.out" });
});
gsap.from(".gs-row", { scrollTrigger: { trigger: ".coverage", start: "top 80%" }, x: -20, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" });


/* ----------------------------------------------------
   2. HOLOGRAPHIC 3D MORPH (Bruno Simon Style)
---------------------------------------------------- */
const webglContainer = document.getElementById('webgl-container');
let scene, camera, renderer, morphMesh, material;

// Increase geometry density for ultra-premium look
const vertexCount = 3000;
const micPositions = new Float32Array(vertexCount * 3);
const spherePositions = new Float32Array(vertexCount * 3);

// Create Holographic Glowing Sprite Texture
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 122, 0, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 122, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// Generate Math for Perfect Sphere
for (let i = 0; i < vertexCount; i++) {
  const phi = Math.acos(1 - 2 * (i + 0.5) / vertexCount);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  const r = 1.4; 
  spherePositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
  spherePositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  spherePositions[i*3+2] = r * Math.cos(phi);
}

// Generate Math for Classic Shure 55 Mic
const headPts = 1800; const yokePts = 600; const handlePts = 300; const basePts = 300;

for (let i = 0; i < vertexCount; i++) {
  if (i < headPts) {
    const numRings = 20;
    const ptsPerRing = headPts / numRings;
    const rIdx = Math.floor(i / ptsPerRing);
    const pIdx = i % ptsPerRing;
    const angle = (pIdx / ptsPerRing) * Math.PI * 2;
    const v = (rIdx / (numRings - 1)) * 2 - 1; 
    
    // Squircle profile
    const profile = Math.pow(1 - Math.pow(Math.abs(v), 3), 0.5); 
    micPositions[i*3] = Math.cos(angle) * 0.45 * profile; 
    micPositions[i*3+1] = (v * 0.6) + 0.6;                
    micPositions[i*3+2] = Math.sin(angle) * 0.3 * profile; 
  } else if (i < headPts + yokePts) {
    const idx = i - headPts;
    const t = idx / yokePts; 
    const angle = Math.PI + (t * Math.PI); 
    const r = 0.55; 
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = Math.sin(angle) * r + 0.6; 
    micPositions[i*3+2] = (Math.random() - 0.5) * 0.08; 
  } else if (i < headPts + yokePts + handlePts) {
    const idx = i - (headPts + yokePts);
    const angle = Math.random() * Math.PI * 2;
    const r = 0.06; 
    const y = (idx / handlePts) * -0.9 + 0.1; 
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = y;
    micPositions[i*3+2] = Math.sin(angle) * r;
  } else {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.6; 
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = -0.8 + (Math.random() * 0.05); 
    micPositions[i*3+2] = Math.sin(angle) * r;
  }
}

if (webglContainer) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, webglContainer.clientWidth / webglContainer.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(webglContainer.clientWidth, webglContainer.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  webglContainer.appendChild(renderer.domElement);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(micPositions.slice(), 3));
  geometry.morphAttributes.position = [];
  geometry.morphAttributes.position[0] = new THREE.BufferAttribute(spherePositions, 3);

  // Holographic Material using Additive Blending
  material = new THREE.PointsMaterial({ 
    color: 0xffaa55,
    size: 0.12, 
    map: createGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.45
  });
  
  morphMesh = new THREE.Points(geometry, material);
  scene.add(morphMesh);
  
  camera.position.z = 5;
  
  let time = 0;
  let targetMorph = 0;
  let currentMorph = 0;
  let shockwaveScale = 1;

  function animate3D() {
    requestAnimationFrame(animate3D);
    time += 0.015;

    // Mouse Parallax Physics
    const targetRotX = (mouse.y / window.innerHeight - 0.5) * 0.3;
    const targetRotY = (mouse.x / window.innerWidth - 0.5) * 0.3;
    
    morphMesh.rotation.x += (targetRotX - morphMesh.rotation.x) * 0.05;
    morphMesh.rotation.y += (targetRotY + time * 0.2 - morphMesh.rotation.y) * 0.05;
    morphMesh.position.y = Math.sin(time * 2) * 0.05;

    // Spring Physics Morphing
    currentMorph += (targetMorph - currentMorph) * 0.08;
    morphMesh.morphTargetInfluences = [currentMorph];

    // Shockwave Scale application
    morphMesh.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
    shockwaveScale += (1 - shockwaveScale) * 0.1; // Snap back to 1

    renderer.render(scene, camera);
  }

  animate3D();

  window.addEventListener('resize', () => {
    if(!webglContainer) return;
    camera.aspect = webglContainer.clientWidth / webglContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(webglContainer.clientWidth, webglContainer.clientHeight);
  });
}

/* ----------------------------------------------------
   3. BACKGROUND CANVAS LOGIC
---------------------------------------------------- */
const bgCanvas = document.getElementById('network-canvas');
let speedMultiplier = 1; 

if (bgCanvas) {
  const ctx = bgCanvas.getContext('2d');
  let width, height, particles;

  function initCanvas() {
    width = bgCanvas.width = window.innerWidth;
    height = bgCanvas.height = window.innerHeight;
    particles = [];
    const count = window.innerWidth < 768 ? 30 : 60;
    for(let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5
      });
    }
  }

  function animateCanvas() {
    requestAnimationFrame(animateCanvas);
    ctx.clearRect(0, 0, width, height);
    
    for(let i = 0; i < particles.length; i++) {
      let p = particles[i];
      p.x += (p.vx * speedMultiplier); p.y += (p.vy * speedMultiplier);
      if(p.x < 0 || p.x > width) p.vx *= -1;
      if(p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 122, 0, ${speedMultiplier > 1 ? 0.6 : 0.2})`; ctx.fill();

      for(let j = i + 1; j < particles.length; j++) {
        let p2 = particles[j];
        let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        let maxDist = speedMultiplier > 1 ? 200 : 100;
        
        if(dist < maxDist) {
          ctx.beginPath(); ctx.strokeStyle = `rgba(255, 122, 0, ${0.15 - dist/1000})`;
          ctx.lineWidth = speedMultiplier > 1 ? 1 : 0.5; 
          ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }
      }
    }
  }
  window.addEventListener('resize', initCanvas);
  initCanvas(); animateCanvas();
}

/* ----------------------------------------------------
   4. PLAY TRIGGER (Shockwave Morph)
---------------------------------------------------- */
const masterPlayBtn = document.getElementById('master-play-btn');
const iconPlay = document.getElementById('master-icon-play');
const iconPause = document.getElementById('master-icon-pause');
const scrubberFill = document.getElementById('scrubber-fill');

let isPlaying = false;
let fakeTime = 0;
let scrubberInterval;

if (masterPlayBtn) {
  masterPlayBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      masterPlayBtn.classList.add('playing');
      
      // TRIGGER THE SHOCKWAVE MORPH
      if (typeof targetMorph !== 'undefined') {
        targetMorph = 1; // Morph to Bubble
        shockwaveScale = 1.3; // Briefly blow up size
        material.opacity = 0.8; // Burn bright
      }
      
      speedMultiplier = 12; // Accelerate background
      
      // Decay flash and background
      let decayInterval = setInterval(() => {
        speedMultiplier -= 0.4;
        if(speedMultiplier <= 1) {
          speedMultiplier = 1;
          clearInterval(decayInterval);
          if (material) material.opacity = 0.5; // Settle into bubble opacity
        }
      }, 50);

      // 15-second looping scrubber
      clearInterval(scrubberInterval);
      scrubberInterval = setInterval(() => {
        fakeTime += 0.05; 
        if (fakeTime > 15) fakeTime = 0; 
        scrubberFill.style.width = `${(fakeTime / 15) * 100}%`;
      }, 50);

    } else {
      // Pause
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      masterPlayBtn.classList.remove('playing');
      
      // Morph back to Microphone
      if (typeof targetMorph !== 'undefined') {
        targetMorph = 0;
        shockwaveScale = 0.9; // Slight suck-in effect
        material.opacity = 0.45; 
      }
      
      clearInterval(scrubberInterval);
    }
  });
}
