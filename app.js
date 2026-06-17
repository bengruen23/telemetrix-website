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
   2. THE MORPHING 3D SHAPE (Three.js)
---------------------------------------------------- */
const webglContainer = document.getElementById('webgl-container');
let scene, camera, renderer, morphMesh, material;

// We need two states for the morph target: A Mic and a Sphere. 
// To morph perfectly, they must have the exact same number of vertices.
// We use a high-density Sphere and map its points to form a mic initially.

const vertexCount = 1000;
const micPositions = new Float32Array(vertexCount * 3);
const spherePositions = new Float32Array(vertexCount * 3);

// Generate Sphere Vertices (The "Bubble")
for (let i = 0; i < vertexCount; i++) {
  // Use golden ratio spiral to distribute points evenly on a sphere
  const phi = Math.acos(1 - 2 * (i + 0.5) / vertexCount);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  
  const r = 1.8; // Radius of the bubble
  
  spherePositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
  spherePositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  spherePositions[i*3+2] = r * Math.cos(phi);
}

// Generate Microphone Vertices
for (let i = 0; i < vertexCount; i++) {
  // We divide the points into three sections: Head, Handle, Base Ring
  if (i < vertexCount * 0.5) {
    // Top capsule (Mic head)
    const phi = Math.acos(1 - 2 * ((i*2) + 0.5) / vertexCount);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i*2);
    const r = 0.5;
    micPositions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    micPositions[i*3+1] = (r * Math.sin(phi) * Math.sin(theta)) + 0.5; // Shifted up
    micPositions[i*3+2] = r * Math.cos(phi);
  } else if (i < vertexCount * 0.8) {
    // Handle (Cylinder)
    const angle = Math.random() * Math.PI * 2;
    const y = (Math.random() * 1.5) - 1.0; // Between -1.0 and 0.5
    const r = 0.15;
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = y;
    micPositions[i*3+2] = Math.sin(angle) * r;
  } else {
    // Base Ring
    const angle = Math.random() * Math.PI * 2;
    const r = 0.7;
    micPositions[i*3] = Math.cos(angle) * r;
    micPositions[i*3+1] = -0.2;
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

  // We use Points instead of a Mesh wireframe for a cleaner transition
  const geometry = new THREE.BufferGeometry();
  
  // Set initial position to the Mic
  geometry.setAttribute('position', new THREE.BufferAttribute(micPositions.slice(), 3));
  
  // Add morph targets
  geometry.morphAttributes.position = [];
  geometry.morphAttributes.position[0] = new THREE.BufferAttribute(spherePositions, 3);

  material = new THREE.PointsMaterial({ 
    color: 0xe8924a,
    size: 0.03,
    transparent: true,
    opacity: 0.6
  });
  
  morphMesh = new THREE.Points(geometry, material);
  scene.add(morphMesh);
  
  camera.position.z = 4.5;
  
  let time = 0;
  let isMorphed = false;
  let morphProgress = 0;

  function animate3D() {
    requestAnimationFrame(animate3D);
    time += 0.02;

    // Organic Rotation
    morphMesh.rotation.y = time * 0.5;
    morphMesh.rotation.x = Math.sin(time * 0.2) * 0.2;
    morphMesh.position.y = Math.sin(time * 0.8) * 0.1;

    // Handle the morph transition
    if (isMorphed && morphProgress < 1) {
      morphProgress += 0.02; // Speed of transforming into bubble
    } else if (!isMorphed && morphProgress > 0) {
      morphProgress -= 0.02; // Speed of transforming back to mic
    }
    
    // Clamp
    morphProgress = Math.max(0, Math.min(1, morphProgress));

    // Apply morph influence (0 = Mic, 1 = Sphere)
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
   4. UI LOGIC (Play Button -> Morph Trigger)
---------------------------------------------------- */
const masterPlayBtn = document.getElementById('master-play-btn');
const iconPlay = document.getElementById('master-icon-play');
const iconPause = document.getElementById('master-icon-pause');
const scrubberFill = document.getElementById('scrubber-fill');
const timeCurrent = document.getElementById('time-current');

let isPlaying = false;
let fakeTime = 0;
let scrubberInterval;

if (masterPlayBtn) {
  masterPlayBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
      // 1. UI updates to Pause
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      masterPlayBtn.style.borderColor = 'var(--accent)';
      
      // 2. Trigger the 3D Morph (Microphone -> Bubble)
      if (morphMesh) {
        morphMesh.material.color.setHex(0xffaa55); // Flash bright
        morphMesh.material.opacity = 0.9;
        
        // This variable is checked in the animate3D loop to run the morph
        // We set it globally since the loop is running independently
        window.isMorphed = true; 
      }
      
      // 3. Ramp up background speed
      speedMultiplier = 15;
      
      // Decay background speed back to normal slowly
      let decayInterval = setInterval(() => {
        speedMultiplier -= 0.5;
        if(speedMultiplier <= 1) {
          speedMultiplier = 1;
          clearInterval(decayInterval);
          if (morphMesh) {
            morphMesh.material.color.setHex(0xe8924a); // Return to standard orange
          }
        }
      }, 100);

      // 4. Start the fake scrubber moving
      clearInterval(scrubberInterval);
      scrubberInterval = setInterval(() => {
        fakeTime += 1;
        
        // Update Scrubber Width
        const totalDuration = 42 * 60 + 15; // 42:15 in seconds
        const percent = (fakeTime / totalDuration) * 100;
        scrubberFill.style.width = `${percent}%`;
        
        // Update Time Text
        const m = Math.floor(fakeTime / 60).toString().padStart(2, '0');
        const s = (fakeTime % 60).toString().padStart(2, '0');
        timeCurrent.innerText = `${m}:${s}`;
        
      }, 1000); // Ticks every second

    } else {
      // Pause clicked
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      masterPlayBtn.style.borderColor = 'var(--ink-primary)';
      
      // Morph back (Bubble -> Microphone)
      window.isMorphed = false; 
      
      if (morphMesh) {
        morphMesh.material.opacity = 0.6;
      }
      
      clearInterval(scrubberInterval);
    }
  });
}
