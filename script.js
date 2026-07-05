// DOM Elements Selection
const starfieldCanvas = document.getElementById('starfield');
const ctx = starfieldCanvas.getContext('2d');

const confettiCanvas = document.getElementById('confetti-canvas');
const cCtx = confettiCanvas.getContext('2d');

const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const btnDismissSuccess = document.getElementById('btn-dismiss-success');

const countdownOverlay = document.getElementById('countdown-overlay');
const warpSpeedText = document.getElementById('warp-speed-text');
const celebrationOverlay = document.getElementById('celebration-overlay');

const rocket = document.getElementById('rocket');
const rocketAssembly = document.getElementById('rocket-assembly');
const thrusterExhaust = document.getElementById('thruster-exhaust');

const smokeContainer = document.getElementById('smoke-particles-container');
const sparklesContainer = document.getElementById('sparkles-container');

// Telemetry Stats DOM Elements
const statPhase = document.getElementById('stat-phase');
const statThrust = document.getElementById('stat-thrust');
const statAltitude = document.getElementById('stat-altitude');
const statVelocity = document.getElementById('stat-velocity');
const statStars = document.getElementById('stat-stars');

// Simulation State Variables
let stars = [];
let starfieldSpeed = 0.5;
let isWarpActive = false;
let starfieldAnimId = null;

let confettiParticles = [];
let confettiAnimId = null;

let smokeIntervalId = null;
let sparkIntervalId = null;
let telemetryIntervalId = null;

// Telemetry values
let telemetry = {
  phase: 'PRE-LAUNCH READY',
  thrust: 0,
  altitude: 0,
  velocity: 0,
  starMultiplier: 1.0
};

// Help Promise delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/* ==========================================================================
   1. Twinkling Starfield System (Canvas)
   ========================================================================== */

function resizeCanvas() {
  starfieldCanvas.width = window.innerWidth;
  starfieldCanvas.height = window.innerHeight;
  initStars();
}

function initStars() {
  stars = [];
  const numStars = Math.floor((starfieldCanvas.width * starfieldCanvas.height) / 8000);
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * starfieldCanvas.width,
      y: Math.random() * starfieldCanvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
      twinkleSpeed: Math.random() * 0.03 + 0.005,
      alpha: Math.random(),
      direction: Math.random() > 0.5 ? 1 : -1
    });
  }
}

function animateStarfield() {
  ctx.clearRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
  
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    
    // Twinkle effect (only when warp is inactive)
    if (!isWarpActive) {
      star.alpha += star.twinkleSpeed * star.direction;
      if (star.alpha >= 1) {
        star.alpha = 1;
        star.direction = -1;
      } else if (star.alpha <= 0.1) {
        star.alpha = 0.1;
        star.direction = 1;
      }
    } else {
      star.alpha = 1.0; // full glow in warp
    }

    // Scroll stars downwards
    let currentSpeed = star.speed * starfieldSpeed;
    star.y += currentSpeed;
    
    if (star.y > starfieldCanvas.height) {
      star.y = 0;
      star.x = Math.random() * starfieldCanvas.width;
    }
    
    ctx.beginPath();
    if (isWarpActive) {
      // Warp speed stretch lines
      const lineLength = star.size * starfieldSpeed * 1.5;
      ctx.strokeStyle = `rgba(255, 255, 255, ${star.alpha * 0.8})`;
      ctx.lineWidth = star.size;
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x, star.y - lineLength);
      ctx.stroke();
    } else {
      // Standard circular twinkling dots
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  starfieldAnimId = requestAnimationFrame(animateStarfield);
}

// Window resizing
window.addEventListener('resize', () => {
  starfieldCanvas.width = window.innerWidth;
  starfieldCanvas.height = window.innerHeight;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  initStars();
});

// Initial load
starfieldCanvas.width = window.innerWidth;
starfieldCanvas.height = window.innerHeight;
initStars();
animateStarfield();

/* ==========================================================================
   2. Confetti Particle System (Canvas)
   ========================================================================== */

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function initConfetti() {
  confettiParticles = [];
  const colors = ['#00f2fe', '#4facfe', '#ec4899', '#f43f5e', '#fbbf24', '#10b981'];
  for (let i = 0; i < 120; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * confettiCanvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
      speed: Math.random() * 3 + 2
    });
  }
}

function animateConfetti() {
  cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  
  let activeConfetti = false;
  for (let i = 0; i < confettiParticles.length; i++) {
    const p = confettiParticles[i];
    p.tiltAngle += p.tiltAngleIncremental;
    p.y += p.speed;
    p.x += Math.sin(p.tiltAngle) * 1.5;
    p.tilt = Math.sin(p.tiltAngle - i / 3) * 12;
    
    // Recycle confetti at top if it goes off screen bottom
    if (p.y > confettiCanvas.height) {
      p.y = -20;
      p.x = Math.random() * confettiCanvas.width;
    }
    
    activeConfetti = true;
    
    cCtx.beginPath();
    cCtx.lineWidth = p.r;
    cCtx.strokeStyle = p.color;
    cCtx.moveTo(p.x + p.tilt + p.r / 2, p.y);
    cCtx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
    cCtx.stroke();
  }
  
  if (activeConfetti) {
    confettiAnimId = requestAnimationFrame(animateConfetti);
  }
}

function stopConfetti() {
  if (confettiAnimId) {
    cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
  }
  cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = [];
}

/* ==========================================================================
   3. Smoke & Spark Emitters
   ========================================================================== */

function spawnSmoke() {
  const smoke = document.createElement('div');
  smoke.className = 'smoke-cloud';
  
  // Centered around rocket bottom base (container width is 280px)
  // Engine is centered at 140px. Drift smoke slightly randomly.
  const randomX = 100 + Math.random() * 80; 
  const randomSize = 25 + Math.random() * 40; 
  const duration = 1.2 + Math.random() * 0.8;
  
  smoke.style.left = `${randomX}px`;
  smoke.style.width = `${randomSize}px`;
  smoke.style.height = `${randomSize}px`;
  smoke.style.animationDuration = `${duration}s`;
  
  smokeContainer.appendChild(smoke);
  
  // Clean up element after animation
  setTimeout(() => {
    smoke.remove();
  }, duration * 1000);
}

function spawnSpark() {
  const spark = document.createElement('div');
  spark.className = 'spark';
  
  // Sparks starting around the engine assembly (relative to 280px container width)
  const startX = 125 + Math.random() * 30; // 125px to 155px
  const startY = 320; // nozzle height
  
  // Random offset directions
  const targetX = (Math.random() - 0.5) * 180;
  const targetY = 30 + Math.random() * 90;
  
  spark.style.left = `${startX}px`;
  spark.style.top = `${startY}px`;
  spark.style.setProperty('--x', `${targetX}px`);
  spark.style.setProperty('--y', `${targetY}px`);
  
  const duration = 0.4 + Math.random() * 0.4;
  spark.style.animationDuration = `${duration}s`;
  
  sparklesContainer.appendChild(spark);
  
  setTimeout(() => {
    spark.remove();
  }, duration * 1000);
}

/* ==========================================================================
   4. Telemetry Terminal Data Engine
   ========================================================================== */

function updateTelemetryUI() {
  statPhase.innerText = telemetry.phase;
  statThrust.innerText = `${telemetry.thrust.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kN`;
  statAltitude.innerText = `${telemetry.altitude.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
  statVelocity.innerText = `${telemetry.velocity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km/s`;
  statStars.innerText = `${telemetry.starMultiplier.toFixed(2)}x (${isWarpActive ? 'WARP' : 'NORMAL'})`;
}

function startTelemetryTick(phaseName, targetThrust, altitudeInc = 0, velocityInc = 0) {
  if (telemetryIntervalId) clearInterval(telemetryIntervalId);
  
  telemetryIntervalId = setInterval(() => {
    telemetry.phase = phaseName;
    
    // Smoothly interpolate thrust to target
    if (telemetry.thrust < targetThrust) {
      telemetry.thrust += Math.min(150, targetThrust - telemetry.thrust);
    } else if (telemetry.thrust > targetThrust) {
      telemetry.thrust -= Math.min(150, telemetry.thrust - targetThrust);
    }
    
    // Increment stats
    if (altitudeInc > 0) {
      telemetry.altitude += altitudeInc * (1 + (telemetry.velocity * 0.05));
    }
    if (velocityInc > 0) {
      telemetry.velocity += velocityInc;
    }
    
    // Boundary clamp for safety
    if (telemetry.altitude < 0) telemetry.altitude = 0;
    if (telemetry.velocity < 0) telemetry.velocity = 0;
    
    updateTelemetryUI();
  }, 50);
}

/* ==========================================================================
   5. Sequential Launch Timeline UI
   ========================================================================== */

function activateStep(stepNum) {
  // Mark all prior steps as completed
  for (let i = 1; i < stepNum; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    if (stepEl) {
      stepEl.classList.remove('active');
      stepEl.classList.add('completed');
    }
  }
  
  // Set current step as active
  const currentStepEl = document.getElementById(`step-${stepNum}`);
  if (currentStepEl) {
    currentStepEl.classList.remove('completed');
    currentStepEl.classList.add('active');
  }
}

/* ==========================================================================
   6. Main Launch Sequence (Async/Await Flow)
   ========================================================================== */

async function startLaunchSequence() {
  // Guard clause & state disable
  btnStart.disabled = true;
  btnReset.disabled = true; // disable reset briefly during countdown sequence initialization

  try {
    /* ---------------------------------------------------------
       STEP 1: Rocket Fade-in & Gantry Retraction
       --------------------------------------------------------- */
    activateStep(1);
    startTelemetryTick('SYSTEM CHECK & RETRACTION', 0);
    
    // Add visual classes to trigger CSS transitions
    rocket.classList.add('rocket-fade-in');
    rocketAssembly.classList.add('gantry-retracted');
    
    await delay(1800); // Wait for fade-in & gantry swing to complete

    /* ---------------------------------------------------------
       STEP 2: Countdown (3... 2... 1...)
       --------------------------------------------------------- */
    activateStep(2);
    startTelemetryTick('T-MINUS COUNTDOWN', 0);
    countdownOverlay.classList.remove('hidden');

    for (let count = 3; count >= 1; count--) {
      // Visual text tick update
      countdownOverlay.innerText = count;
      countdownOverlay.classList.remove('tick-anim');
      void countdownOverlay.offsetWidth; // Force CSS reflow
      countdownOverlay.classList.add('tick-anim');
      
      // Keep emitting sparks & smoke pre-ignition at scale 1
      if (count === 1) {
        // Early sparks
        sparkIntervalId = setInterval(spawnSpark, 80);
      }
      
      await delay(1000);
    }
    
    countdownOverlay.innerText = 'LIFT-OFF';
    await delay(800);
    countdownOverlay.classList.add('hidden');

    /* ---------------------------------------------------------
       STEP 3: Rocket Ignition & Shaking (1 second)
       --------------------------------------------------------- */
    activateStep(3);
    startTelemetryTick('ENGINE IGNITION & HEATING', 1600);
    rocket.classList.add('rocket-shaking');
    
    // Increase spark frequencies
    if (sparkIntervalId) clearInterval(sparkIntervalId);
    sparkIntervalId = setInterval(spawnSpark, 30);
    
    await delay(1000);

    /* ---------------------------------------------------------
       STEP 4: Smoke Particles Ejection
       --------------------------------------------------------- */
    activateStep(4);
    startTelemetryTick('MAXIMUM PRESSURE / FLAME VENT', 3200);
    thrusterExhaust.classList.add('exhaust-active');
    
    // Start smoke emitter
    smokeIntervalId = setInterval(spawnSmoke, 25);
    
    await delay(1500);

    /* ---------------------------------------------------------
       STEP 5: Smooth Ascent Launch
       --------------------------------------------------------- */
    activateStep(5);
    
    // Dynamic telemetry climbing
    startTelemetryTick('LAUNCH LIFT-OFF', 3600, 0.12, 0.08);
    rocket.classList.remove('rocket-shaking');
    rocket.classList.add('rocket-launching');
    
    // Gradually increase star background speed to show upward thrust
    let speedTimer = setInterval(() => {
      if (starfieldSpeed < 4.0) {
        starfieldSpeed += 0.15;
        telemetry.starMultiplier = starfieldSpeed * 2;
      } else {
        clearInterval(speedTimer);
      }
    }, 100);

    await delay(3500);

    /* ---------------------------------------------------------
       STEP 6: Twinkle Scintillation Speed-up (Warp Speed)
       --------------------------------------------------------- */
    activateStep(6);
    
    // Set Warp values
    isWarpActive = true;
    warpSpeedText.classList.add('active');
    startTelemetryTick('ATMOSPHERE BREAK / HYPERDRIVE', 4500, 2.5, 0.9);
    
    // Rapid star acceleration
    let warpTimer = setInterval(() => {
      if (starfieldSpeed < 26.0) {
        starfieldSpeed += 1.2;
        telemetry.starMultiplier = starfieldSpeed * 2;
      } else {
        clearInterval(warpTimer);
      }
    }, 50);

    await delay(2500);
    clearInterval(warpTimer);

    /* ---------------------------------------------------------
       STEP 7: Orbit Achieved & Celebration
       --------------------------------------------------------- */
    activateStep(7);
    
    // Stop engines & sparks, stabilize in orbit
    if (sparkIntervalId) clearInterval(sparkIntervalId);
    if (smokeIntervalId) clearInterval(smokeIntervalId);
    thrusterExhaust.classList.remove('exhaust-active');
    
    // Slow down starfield to beautiful floating speed
    isWarpActive = false;
    warpSpeedText.classList.remove('active');
    starfieldSpeed = 0.15; // slow drift in orbit
    telemetry.starMultiplier = 0.3;
    
    // Orbit stabilization stats
    startTelemetryTick('ORBIT STABILIZED', 0, 0, 0);
    telemetry.altitude = 420.00;
    telemetry.velocity = 9.12; // 9.12 km/s (32,832 km/h)
    updateTelemetryUI();
    
    // Complete last step checkbox
    const lastStep = document.getElementById('step-7');
    if (lastStep) {
      lastStep.classList.remove('active');
      lastStep.classList.add('completed');
    }

    await delay(800);
    
    // Trigger Success Overlay
    celebrationOverlay.classList.remove('hidden');
    resizeConfettiCanvas();
    initConfetti();
    animateConfetti();

  } catch (error) {
    console.error('Launch sequence interrupted or encountered an error:', error);
  } finally {
    // Keep Start button disabled until Reset is clicked
    btnStart.disabled = true;
    btnReset.disabled = false;
  }
}

/* ==========================================================================
   7. Reset / Abort Sequence Operations
   ========================================================================== */

function resetLaunchSequence() {
  // Clear all running loops and timers
  if (smokeIntervalId) clearInterval(smokeIntervalId);
  if (sparkIntervalId) clearInterval(sparkIntervalId);
  if (telemetryIntervalId) clearInterval(telemetryIntervalId);
  stopConfetti();

  // Reset SVG elements state classes
  rocket.className = 'rocket-idle';
  rocketAssembly.className = 'rocket-assembly';
  thrusterExhaust.className = 'exhaust-flames';
  
  // Hide UI overlays
  countdownOverlay.className = 'countdown-overlay hidden';
  warpSpeedText.classList.remove('active');
  celebrationOverlay.classList.add('hidden');

  // Reset starfield parameters
  isWarpActive = false;
  starfieldSpeed = 0.5;

  // Reset telemetry status variables
  telemetry = {
    phase: 'PRE-LAUNCH READY',
    thrust: 0,
    altitude: 0,
    velocity: 0,
    starMultiplier: 1.0
  };
  updateTelemetryUI();

  // Reset timeline timeline steps
  const steps = document.querySelectorAll('.step-item');
  steps.forEach(step => {
    step.classList.remove('active', 'completed');
  });

  // Clear smoke DOM structures
  smokeContainer.innerHTML = '';
  sparklesContainer.innerHTML = '';

  // Re-enable Start button
  btnStart.disabled = false;
  btnReset.disabled = true;
}

// Event Listeners Binding
btnStart.addEventListener('click', startLaunchSequence);
btnReset.addEventListener('click', resetLaunchSequence);
btnDismissSuccess.addEventListener('click', () => {
  celebrationOverlay.classList.add('hidden');
  stopConfetti();
});
