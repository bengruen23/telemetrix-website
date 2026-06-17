/* ----------------------------------------------------
   1. TEXT ANIMATION & SCROLL
---------------------------------------------------- */
const textWrapper = document.querySelector('#hero-title');
if (textWrapper) {
  textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='word'><span class='char'>$&</span></span>");

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
   2. THE 3D "BUBBLE" (Three.js)
---------------------------------------------------- */
const bubbleContainer = document.getElementById('webgl-bubble');
let material, sphere, positionAttribute, originalPositions;
let burstIntensity = 0;

if (bubbleContainer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, bubbleContainer.clientWidth / bubbleContainer.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(bubbleContainer.clientWidth, bubbleContainer.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  bubbleContainer.appendChild(renderer.domElement);

  const geometry = new THREE.IcosahedronGeometry(2, 5); 
  material = new THREE.MeshBasicMaterial({ 
    color: 0xe8924a,
    wireframe: true,
    transparent: true,
    opacity: 0.45 
  });
  
  sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  
  camera.position.z = 4.5;
  camera.position.x = 0; 
  
  originalPositions = geometry.attributes.position.clone();
  positionAttribute = geometry.attributes.position;
  
  let time = 0;

  function animateBubble() {
    requestAnimationFrame(animateBubble);
    time += 0.05;

    sphere.rotation.y += 0.002;
    sphere.rotation.x += 0.001;

    let autoPulse = Math.sin(time * 0.5) * 0.3; 

    for (let i = 0; i < positionAttribute.count; i++) {
      let ox = originalPositions.getX(i);
      let oy = originalPositions.getY(i);
      let oz = originalPositions.getZ(i);

      let noise = Math.sin(ox * 2 + time) * Math.cos(oy * 2 + time) * Math.sin(oz * 2 + time);
      let spike = 1 + ((autoPulse + noise) * (0.1 + burstIntensity));

      positionAttribute.setXYZ(i, ox * spike, oy * spike, oz * spike);
    }
    
    positionAttribute.needsUpdate = true;
    renderer.render(scene, camera);
  }

  animateBubble();

  window.addEventListener('resize', () => {
    if(!bubbleContainer) return;
    camera.aspect = bubbleContainer.clientWidth / bubbleContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(bubbleContainer.clientWidth, bubbleContainer.clientHeight);
  });
}

/* ----------------------------------------------------
   3. 2D BACKGROUND CANVAS & FAKE PLAY LOGIC
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

  let mouse = { x: null, y: null };
  window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });

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
      if (mouse.x != null) {
        let dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dist < 150) {
          ctx.beginPath(); ctx.strokeStyle = `rgba(244, 241, 234, ${0.3 - dist/500})`;
          ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
  }
  window.addEventListener('resize', initCanvas);
  initCanvas(); 
  animateCanvas();
}

// The Fake Play Burst Event Listener
const fakePlayBtn = document.getElementById('fake-play-btn');
const playText = document.getElementById('play-text');

if (fakePlayBtn) {
  fakePlayBtn.addEventListener('click', () => {
    speedMultiplier = 15; 
    burstIntensity = 0.8; 
    
    if (material) {
      material.opacity = 0.8; 
      material.color.setHex(0xffaa55); 
    }
    
    playText.innerText = "System Active";
    fakePlayBtn.style.boxShadow = "0 0 30px rgba(232, 146, 74, 0.8)";
    fakePlayBtn.style.backgroundColor = "var(--bg-elevated)";
    
    let decayInterval = setInterval(() => {
      speedMultiplier -= 0.5;
      burstIntensity -= 0.03;
      
      if(speedMultiplier <= 1) {
        speedMultiplier = 1;
        burstIntensity = 0;
        if (material) {
          material.opacity = 0.45;
          material.color.setHex(0xe8924a); 
        }
        
        playText.innerText = "Initialize Node";
        fakePlayBtn.style.boxShadow = "none";
        fakePlayBtn.style.backgroundColor = "var(--ink-primary)";
        clearInterval(decayInterval);
      }
    }, 100);
  });
}
