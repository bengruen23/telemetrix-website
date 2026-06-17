/* ----------------------------------------------------
   1. TEXT ANIMATION & SCROLL
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
    .add({ targets: '.char', translateY: ["100%", "0%"], opacity: [0, 1], easing: "easeOutExpo", duration: 1200, delay: (el, i) => 20 * i }, "-=600")
    .add({ targets: '.el-sub', opacity: [0, 1], translateY: [20, 0], easing: "easeOutExpo", duration: 1000 }, "-=800")
    .add({ targets: '.el-actions', opacity: [0, 1], translateY: [20, 0], easing: "easeOutExpo", duration: 1000 }, "-=800");
}

gsap.registerPlugin(ScrollTrigger);
gsap.utils.toArray('.gs-fade').forEach(element => {
  gsap.from(element, { scrollTrigger: { trigger: element, start: "top 85%" }, y: 30, opacity: 0, duration: 1, ease: "power2.out" });
});
gsap.from(".gs-row", { scrollTrigger: { trigger: ".coverage", start: "top 80%" }, y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power2.out" });

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});


/* ----------------------------------------------------
   2. THE MORPHING 3D SHAPE (Vintage Mic -> Bubble)
---------------------------------------------------- */
const webglContainer = document.getElementById('webgl-container');
let scene, camera, renderer, morphMesh, material;

// Increased vertex count for high-fidelity vintage microphone details
const vertexCount = 1800;
const micPositions = new Float32Array(vertexCount * 3);
const spherePositions = new Float32Array(vertexCount * 3);

// --- Generate The Bubble (Sphere) ---
for (let i = 0; i < vertexCount; i++) {
  const phi = Math.acos(1 - 2 * (i + 0.5) / vertexCount);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  const r = 1.3; // Tighter bubble size
  spherePositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
  spherePositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  spherePositions[i*3+2] = r * Math.cos(phi);
}

// --- Generate The Vintage Microphone ---
const headPoints = 1000;
const yokePoints = 400;
const handlePoints = 200;
const basePoints = 200;

for (let i = 0; i < vertexCount; i++) {
  if (i < headPoints) {
    // 1. The Head: Ribbed, boxy-oval to simulate the grill
    const numRings = 15;
    const ptsPerRing = headPoints / numRings;
    const rIdx = Math.floor(i / ptsPerRing);
    const pIdx = i % ptsPerRing;
    
    const angle = (pIdx / ptsPerRing) * Math.PI * 2;
    const v = (rIdx / (numRings - 1)) * 2 - 1; // Vertical distribution -1 to 1
    
    // Create a boxy curve profile instead of a perfect sphere
    const profile = Math.sqrt(1 - Math.pow(Math.abs(v), 4)); 
    
    micPositions[i*3] = Math.cos(angle) * 0.35 * profile; // X (Width)
    micPositions[i*3+1] = (v * 0.5) + 0.5;                // Y (Height, shifted up)
    micPositions[i*3+2] = Math.sin(angle) * 0.25 * profile; // Z (Depth)

  } else if (i < headPoints + yokePoints) {
    // 2. The Yoke: U-Mount holding the head
    const idx = i - headPoints;
    const t = idx / yokePoints; 
    const angle = Math.PI + (t * Math.PI); // Half circle
    const r = 0.45; // Wider than the head
    
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = Math.sin(angle) * r + 0.5; // Centers around bottom of head
    micPositions[i*3+2] = (Math.random() - 0.5) * 0.05; // Adds slight thickness

  } else if (i < headPoints + yokePoints + handlePoints) {
    // 3. The Handle: Straight cylinder down to base
    const idx = i - (headPoints + yokePoints);
    const angle = Math.random() * Math.PI * 2;
    const r = 0.05 + (Math.random() * 0.02); 
    const y = (idx / handlePoints) * -0.7 + 0.05; // Reaches from yoke to base
    
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = y;
    micPositions[i*3+2] = Math.sin(angle) * r;

  } else {
    // 4. The Stand Base: Heavy flat disk
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.5; 
    
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = -0.65 + (Math.random() * 0.04); // Disk thickness
    micPositions[i*3+2] = Math.sin(angle) * r;
  }
}

if (webglContainer) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, webglContainer.clientWidth / webglContainer.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(webglContainer.clientWidth, webglContainer.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  webglContainer.appendChild(renderer.domElement);

  // Load points into Buffer Geometry
  const geometry = new THREE.BufferGeometry();
  
  // Set initial state to Microphone
  geometry.setAttribute('position', new THREE.BufferAttribute(micPositions.slice(), 3));
  
  // Set Target state to Bubble
  geometry.morphAttributes.position = [];
  geometry.morphAttributes.position[0] = new THREE.BufferAttribute(spherePositions, 3);

  material = new THREE.PointsMaterial({ 
    color: 0xe8924a,
    size: 0.035, // Size of the orange data points
    transparent: true,
    opacity: 0.65 // High visibility for the mic
  });
  
  morphMesh = new THREE.Points(geometry, material);
  scene.add(morphMesh);
  
  camera.position.z = 4.2;
  
  let time = 0;
  let morphProgress = 0;

  function animate3D() {
    requestAnimationFrame(animate3D);
    time += 0.02;

    // Organic hover and rotation
    morphMesh.rotation.y = time * 0.4;
    morphMesh.position.y = Math.sin(time * 0.8) * 0.05;
    
    // Bubble breathing effect (only active when morphed into bubble)
    if (window.isMorphed) {
        morphMesh.rotation.x = Math.sin(time * 0.2) * 0.2;
    } else {
        morphMesh.rotation.x = 0;
    }

    // Morph translation logic
    if (window.isMorphed && morphProgress < 1) {
      morphProgress += 0.015; // Smoothly slide to bubble
    } else if (!window.isMorphed && morphProgress > 0) {
      morphProgress -= 0.015; // Smoothly slide to mic
    }
    
    morphProgress = Math.max(0, Math.min(1, morphProgress));
    morphMesh.morphTargetInfluences = [morphProgress];

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
   3. 2D BACKGROUND CANVAS
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
    const count = window.innerWidth < 768 ? 40 : 90;
    for(let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 0.5
      });
    }
  }

  function animateCanvas() {
    requestAnimationFrame(animateCanvas);
    ctx.clearRect(0, 0, width, height);
    
    for(let i = 0; i < particles.length; i++) {
      let p = particles[i];
      p.x += (p.vx * speedMultiplier); 
      p.y += (p.vy * speedMultiplier);
      if(p.x < 0 || p.x > width) p.vx *= -1;
      if(p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 146, 74, ${speedMultiplier > 1 ? 0.9 : 0.4})`;
      ctx.fill();

      for(let j = i + 1; j < particles.length; j++) {
        let p2 = particles[j];
        let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        let maxDist = speedMultiplier > 1 ? 180 : 120;
        
        if(dist < maxDist) {
          ctx.beginPath(); 
          ctx.strokeStyle = `rgba(232, 146, 74, ${0.2 - dist/1000})`;
          ctx.lineWidth = speedMultiplier > 1 ? 1.5 : 0.5; 
          ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        }
      }
    }
  }
  window.addEventListener('resize', initCanvas);
  initCanvas(); 
  animateCanvas();
}

/* ----------------------------------------------------
   4. UI LOGIC (Fake 15s Scrubber & Morph Trigger)
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
      // 1. Swap icon to Pause
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      masterPlayBtn.style.borderColor = 'var(--accent)';
      
      // 2. Trigger Morph (Mic -> Bubble)
      window.isMorphed = true; 
      if (morphMesh) {
        morphMesh.material.color.setHex(0xffaa55); // Flash bright
        morphMesh.material.opacity = 0.9;
      }
      
      // 3. Ramp up background speed
      speedMultiplier = 15;
      
      // Decay flash and background speed slowly
      let decayInterval = setInterval(() => {
        speedMultiplier -= 0.5;
        if(speedMultiplier <= 1) {
          speedMultiplier = 1;
          clearInterval(decayInterval);
          if (morphMesh) {
            morphMesh.material.color.setHex(0xe8924a); // Return to orange
            morphMesh.material.opacity = 0.5; // Slightly ghosted as a bubble
          }
        }
      }, 100);

      // 4. Start the 15-second looping scrubber
      clearInterval(scrubberInterval);
      scrubberInterval = setInterval(() => {
        fakeTime += 0.05; // Ticks every 50ms
        
        if (fakeTime > 15) {
            fakeTime = 0; // Loop back to 0 after 15 seconds
        }
        
        const percent = (fakeTime / 15) * 100;
        scrubberFill.style.width = `${percent}%`;
        
      }, 50);

    } else {
      // Pause clicked
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      masterPlayBtn.style.borderColor = 'var(--ink-primary)';
      
      // Morph back (Bubble -> Microphone)
      window.isMorphed = false; 
      if (morphMesh) {
        morphMesh.material.opacity = 0.65; // High visibility for Mic
      }
      
      // Pause scrubber
      clearInterval(scrubberInterval);
    }
  });
}
