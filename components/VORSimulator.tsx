
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plane, Target, ChevronLeft, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlertCircle, Play, Navigation2, RefreshCw, Info, CheckCircle, Award, Map, BarChart2, Activity, Zap, BookOpen, X, CornerUpLeft, CornerUpRight, Clock, Wind, Triangle } from 'lucide-react';
import { playSound } from '../services/audioService.ts';

interface VORSimulatorProps {
  type: 'VOR' | 'HSI';
  missionId?: string | null;
  onExit: () => void;
}

// 3D Point Interface
interface Point3D { x: number, y: number, z: number }

const VORSimulator: React.FC<VORSimulatorProps> = ({ type, missionId = 'f-vor', onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<{ x: number, y: number }[]>([]);
  const aircraftImgRef = useRef<HTMLImageElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const ptTurnCompleteRef = useRef(false);
  
  const isHomingMission = missionId === 'f-homing';
  const isInboundInterceptMission = missionId === 'f-inbound';
  const isOutboundMission = missionId === 'f-outbound';
  const isLandingMission = missionId === 'l-crosswind';
  const stationPos = { x: 0, y: -5000 }; 

  // --- LANDING MISSION STATE ---
  const [landingAlt, setLandingAlt] = useState(500); // 500ft AGL Start
  const [landingDist, setLandingDist] = useState(8000); // Distance to threshold
  const [landingOffset, setLandingOffset] = useState(0); // Lateral offset (Starts centered)
  const [landingPitch, setLandingPitch] = useState(0);
  const [landingRoll, setLandingRoll] = useState(0);
  const [landingYaw, setLandingYaw] = useState(0); // Heading relative to runway
  
  const [isCrashed, setIsCrashed] = useState(false);
  const [explosionParticles, setExplosionParticles] = useState<{x: number, y: number, r: number, c: string, v: {x:number, y:number}}[]>([]);

  // Physics State for Landing
  const [verticalSpeed, setVerticalSpeed] = useState(0);
  
  const [windSpeed, setWindSpeed] = useState(15); // 15 Kts Crosswind
  const [windDir, setWindDir] = useState('left'); // Wind from Left

  // Helper to generate randomized start position for homing missions
  const getInitialPosition = () => {
    if (isHomingMission) {
      const radius = 3500 + Math.random() * 2000;
      const angle = Math.random() * Math.PI * 2;
      return {
          x: stationPos.x + Math.cos(angle) * radius,
          y: stationPos.y + Math.sin(angle) * radius
      };
    }
    if (isInboundInterceptMission) {
      // Start 0.5 NM East of station (passed it)
      const offset = 50; 
      return {
          x: stationPos.x + offset,
          y: stationPos.y
      };
    }
    if (isOutboundMission) {
        // Start 0.5 NM South-South-East (Radial 170)
        // 170 degrees from station.
        const r170rad = (170 - 90) * (Math.PI / 180);
        return {
            x: stationPos.x + Math.cos(r170rad) * 50,
            y: stationPos.y + Math.sin(r170rad) * 50
        };
    }
    return { x: 0, y: 0 }; // Default for f-vor
  };

  const [isPaused, setIsPaused] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showReviewMap, setShowReviewMap] = useState(false);
  const [showCdiExplanation, setShowCdiExplanation] = useState(false);
  
  // New State for PT Selection & Outbound
  const [showPTSelection, setShowPTSelection] = useState(false);
  const [ptTimerDisplay, setPtTimerDisplay] = useState<number | null>(null);
  const [turnInboundAlert, setTurnInboundAlert] = useState(false);
  const [cdiMessage, setCdiMessage] = useState<string | null>(null);
  const [courseChangeAlert, setCourseChangeAlert] = useState(false);

  const [engineHealth, setEngineHealth] = useState(100);
  const [emergencyAlert, setEmergencyAlert] = useState(false);
  const [interceptAlert, setInterceptAlert] = useState(false);
  const [ptAlert, setPtAlert] = useState(false);
  const [inboundEstablishedAlert, setInboundEstablishedAlert] = useState(false);
  
  // Use initialized random position
  const [planePos, setPlanePos] = useState(getInitialPosition()); 
  // Randomize initial heading for homing missions to prevent "lucky" alignment
  const [heading, setHeading] = useState(
      isHomingMission ? Math.floor(Math.random() * 360) : 
      (isInboundInterceptMission ? 90 : 
      (isOutboundMission ? 170 : 0))
  );
  // Initial OBS
  const [obs, setObs] = useState(
      isHomingMission ? 0 : 
      (isInboundInterceptMission ? 90 : 
      (isOutboundMission ? 170 : 0))
  );
  const [radial, setRadial] = useState(0);
  const [isTo, setIsTo] = useState(true);
  const [isOff, setIsOff] = useState(false);
  const [cdiDeflection, setCdiDeflection] = useState(0);
  const [velocity, setVelocity] = useState(0.4); 
  const [headingBug, setHeadingBug] = useState(heading);
  const [turnRate, setTurnRate] = useState(0);
  
  // Phase state updated for new mission
  const [phase, setPhase] = useState<'INTERCEPT' | 'INBOUND' | 'OUTBOUND' | 'HOMING' | 'PROC_TURN' | 'INBOUND_TRACK' | 'FINAL_APPROACH' | 'COURSE_CHANGE' | 'TRACKING'>(
      isInboundInterceptMission ? 'OUTBOUND' : 
      isHomingMission ? 'HOMING' : 
      isLandingMission ? 'FINAL_APPROACH' : 
      isOutboundMission ? 'OUTBOUND' : 'INBOUND'
  );
  
  const [passageAlert, setPassAlert] = useState(false);
  const [showPassageExplanation, setShowPassageExplanation] = useState(false);
  const [steerCombo, setSteerCombo] = useState({ dir: null as 'left' | 'right' | null, count: 0, lastTime: 0 });

  const AIRCRAFT_IMG_URL = "https://lh3.googleusercontent.com/d/1ahthu2ZsyfNcYGsQPI9K9GiIxqM8JUI1";
  const crosswindX = 0.12; 

  const currentDmeValue = Math.hypot(planePos.x - stationPos.x, planePos.y - stationPos.y) / 100;
  const currentDme = currentDmeValue.toFixed(1);

  // Generate procedural environment features
  const envFeatures = useMemo(() => {
    const features: { x: number, y: number, type: 'tree' | 'dirt' | 'road' | 'bush', size: number, rotation?: number }[] = [];
    if (!isHomingMission) return [];
    
    // Seeded random for consistency
    let seed = 42;
    const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    // Trees & Bushes
    for (let i = 0; i < 400; i++) {
        features.push({
            x: (random() - 0.5) * 20000,
            y: (random() - 0.5) * 20000 - 5000,
            type: random() > 0.3 ? 'tree' : 'bush',
            size: 15 + random() * 20
        });
    }

    // Dirt Patches
    for (let i = 0; i < 100; i++) {
        features.push({
            x: (random() - 0.5) * 15000,
            y: (random() - 0.5) * 15000 - 5000,
            type: 'dirt',
            size: 100 + random() * 300,
            rotation: random() * Math.PI
        });
    }

    return features;
  }, [isHomingMission]);

  useEffect(() => {
    const img = new Image();
    img.src = AIRCRAFT_IMG_URL;
    img.onload = () => { aircraftImgRef.current = img; };
  }, []);

  // --- 3D LANDING RENDER LOGIC ---
  const renderLandingScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      // Clear with Sky color
      const gradientSky = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradientSky.addColorStop(0, '#0f172a');
      gradientSky.addColorStop(1, '#60a5fa');
      ctx.fillStyle = gradientSky; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const fov = 600;
      
      // Calculate Horizon position based on Pitch
      const horizonY = height / 2 + (landingPitch * 15);
      
      // Draw Ground
      ctx.fillStyle = '#1e293b'; // Darker "night/dusk" ground
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Grid on ground to show speed/movement
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      
      // CAM LOGIC: Third Person, slightly above ("Chase Cam")
      const camX = landingOffset;
      const camY = landingAlt + 80; // Elevated camera for 3rd person view
      const camZ = landingDist + 250; // Chase cam distance behind plane

      // Projection Function
      const project = (x: number, y: number, z: number) => {
          // Relative to camera
          let rx = x - camX;
          let ry = y - camY;
          let rz = z - camZ; 

          // Rotate world opposite to plane Yaw (camera follows heading)
          const yawRad = -landingYaw * Math.PI / 180; 
          const rx2 = rx * Math.cos(yawRad) - rz * Math.sin(yawRad);
          const rz2 = rx * Math.sin(yawRad) + rz * Math.cos(yawRad);
          rx = rx2;
          rz = rz2;

          // Pitch rotation (around X axis)
          const pitchRad = -landingPitch * Math.PI / 180;
          const ry2 = ry * Math.cos(pitchRad) - rz * Math.sin(pitchRad);
          const rz3 = ry * Math.sin(pitchRad) + rz * Math.cos(pitchRad);
          ry = ry2;
          rz = rz3;

          if (rz >= 0) return null; // Behind camera

          const scale = fov / Math.abs(rz);
          return {
              x: width / 2 + rx * scale,
              y: height / 2 - ry * scale, // Y grows up in 3D, down in Canvas
              scale: scale
          };
      };

      // Draw Runway (Extended Length)
      const rWidth = 100;
      const rLength = 15000;
      const p1 = project(-rWidth, 0, 0);
      const p2 = project(rWidth, 0, 0);
      const p3 = project(rWidth, 0, -rLength);
      const p4 = project(-rWidth, 0, -rLength);

      if (p1 && p2 && p3 && p4) {
          ctx.fillStyle = '#333';
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.fill();
          
          // Centerline
          ctx.strokeStyle = '#fff';
          ctx.setLineDash([30, 30]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          const start = project(0, 0, 0);
          const end = project(0, 0, -rLength);
          if (start && end) {
             ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
          }
          ctx.setLineDash([]);
          
          // Threshold Numbers
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px monospace';
          const numPos = project(-10, 0, -100);
          if (numPos) ctx.fillText("36", numPos.x, numPos.y);
      }

      // Draw Ground Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      const gridSize = 500;
      const gridOffsetZ = Math.floor(landingDist / gridSize) * gridSize;
      const gridOffsetX = Math.floor(landingOffset / gridSize) * gridSize;
      
      for(let i = -5; i <= 20; i++) {
          const z = -gridOffsetZ + (i * gridSize); 
          if (z < camZ) {
             const g1 = project(gridOffsetX - 10000, 0, z);
             const g2 = project(gridOffsetX + 10000, 0, z);
             if (g1 && g2) { ctx.beginPath(); ctx.moveTo(g1.x, g1.y); ctx.lineTo(g2.x, g2.y); ctx.stroke(); }
          }
      }

      ctx.restore();

      // --- SHADOW RENDERING ---
      // We project the plane's position onto the ground (y=0)
      if (!isCrashed) {
          const shadowPos = project(landingOffset, 0, landingDist);
          if (shadowPos) {
              ctx.save();
              ctx.translate(shadowPos.x, shadowPos.y);
              // Rotate shadow by heading
              ctx.rotate((landingYaw) * Math.PI / 180);
              // Scale shadow based on altitude (smaller when high)
              const shadowScale = shadowPos.scale * 3.0; 
              ctx.scale(shadowScale, shadowScale * 0.5); // Flattened
              
              ctx.fillStyle = 'rgba(0,0,0,0.3)';
              ctx.beginPath();
              ctx.moveTo(0, -40); ctx.lineTo(60, 2); ctx.lineTo(0, 35); ctx.lineTo(-60, 2); 
              ctx.fill();
              ctx.restore();
          }
      }

      // --- 3D AIRCRAFT RENDERING ---
      // Center screen but lowered to give "looking from above" feel
      const planeScreenY = height / 2 + 80; 
      
      ctx.save();
      ctx.translate(width / 2, planeScreenY); 
      
      if (isCrashed) {
          // EXPLOSION ANIMATION
          explosionParticles.forEach(p => {
              ctx.fillStyle = p.c;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fill();
          });
          ctx.restore();
          
          // Crash Text
          ctx.fillStyle = 'red';
          ctx.font = '900 40px monospace';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'black'; ctx.shadowBlur = 10;
          ctx.fillText("CRITICAL FAILURE", width/2, height/2);
          ctx.font = 'bold 20px monospace';
          ctx.fillStyle = 'white';
          ctx.fillText("IMPACT WITH TERRAIN", width/2, height/2 + 40);
          
      } else {
          // NORMAL PLANE RENDER
          ctx.rotate(landingRoll * Math.PI / 180); // Bank
          ctx.rotate(landingYaw * 0.1 * Math.PI / 180); // Slight visual yaw relative to camera
          
          const acScale = 3.0; // Bigger plane
          
          // Local Aircraft Projection
          const projectAC = (v: Point3D) => {
              const pr = landingPitch * Math.PI / 180;
              const y1 = v.y * Math.cos(pr) - v.z * Math.sin(pr);
              const z1 = v.y * Math.sin(pr) + v.z * Math.cos(pr);
              const scale = 400 / (400 + z1 + 50); 
              return { x: v.x * scale * acScale, y: y1 * scale * acScale };
          };

          const vertices = [
              { x: 0, y: 0, z: 50 },   // 0 Nose
              { x: 0, y: 12, z: 10 },  // 1 Cockpit
              { x: 8, y: -5, z: 10 },  // 2 Body Front Right
              { x: -8, y: -5, z: 10 }, // 3 Body Front Left
              { x: 0, y: 0, z: -50 },  // 4 Tail
              { x: 70, y: 2, z: 5 },   // 5 Wing Left Tip
              { x: -70, y: 2, z: 5 },  // 6 Wing Right Tip
              { x: 0, y: 30, z: -45 }, // 7 Vert Stab Top
              { x: 25, y: 2, z: -45 }, // 8 Horz Stab Left
              { x: -25, y: 2, z: -45 },// 9 Horz Stab Right
          ];

          const ap4 = projectAC(vertices[4]);
          const ap7 = projectAC(vertices[7]);
          const ap8 = projectAC(vertices[8]);
          const ap9 = projectAC(vertices[9]);
          
          // Tail Section
          ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.moveTo(ap4.x, ap4.y); ctx.lineTo(ap8.x, ap8.y); ctx.lineTo(ap9.x, ap9.y); ctx.fill();
          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(ap4.x, ap4.y); ctx.lineTo(ap4.x, ap4.y-5); ctx.lineTo(ap7.x, ap7.y); ctx.fill();

          const ap2 = projectAC(vertices[2]);
          const ap3 = projectAC(vertices[3]);
          const ap5 = projectAC(vertices[5]);
          const ap6 = projectAC(vertices[6]);
          
          // Wings
          ctx.fillStyle = '#cbd5e1'; 
          ctx.beginPath(); ctx.moveTo(ap2.x, ap2.y); ctx.lineTo(ap5.x, ap5.y); ctx.lineTo(ap5.x, ap5.y+10); ctx.lineTo(ap3.x, ap3.y); ctx.fill(); // Right
          ctx.beginPath(); ctx.moveTo(ap3.x, ap3.y); ctx.lineTo(ap6.x, ap6.y); ctx.lineTo(ap6.x, ap6.y+10); ctx.lineTo(ap2.x, ap2.y); ctx.fill(); // Left

          const ap0 = projectAC(vertices[0]); 
          const ap1 = projectAC(vertices[1]); 
          
          // Fuselage
          ctx.fillStyle = '#94a3b8'; 
          ctx.beginPath(); ctx.moveTo(ap0.x, ap0.y); ctx.lineTo(ap2.x, ap2.y); ctx.lineTo(ap4.x, ap4.y); ctx.lineTo(ap3.x, ap3.y); ctx.fill();
          
          // Cockpit
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath(); ctx.moveTo(ap0.x, ap0.y); ctx.lineTo(ap2.x, ap2.y); ctx.lineTo(ap1.x, ap1.y); ctx.lineTo(ap3.x, ap3.y); ctx.fill();

          // Propeller Disc
          ctx.save();
          ctx.translate(ap0.x, ap0.y);
          ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
          ctx.beginPath(); ctx.ellipse(0, 0, 25 * acScale, 25 * acScale, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          ctx.restore();
      }

      // --- HUD ---
      if (!isCrashed && !isCompleted) {
          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = '#0f0';
          ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
          ctx.fillText(`ALT: ${landingAlt.toFixed(0)} FT`, 20, 30);
          ctx.fillText(`DST: ${(landingDist/6076).toFixed(1)} NM`, 20, 50);
          ctx.fillText(`OFFSET: ${Math.abs(landingOffset).toFixed(0)} FT ${landingOffset > 0 ? 'R' : 'L'}`, 20, 70);
          ctx.fillText(`VS: ${verticalSpeed.toFixed(0)} FPM`, 20, 90);
      }
  };

  // Main Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      // 3D Landing Mission Logic
      if (isLandingMission) {
          if (!isPaused && !isCompleted && !isCrashed) {
              // --- PHYSICS ENGINE ---
              const dt = 0.016; 
              
              const speed = 120 * 1.68781; 
              const frameDist = speed * dt;
              setLandingDist(prev => prev - frameDist);

              const targetVS = landingPitch * 150; 
              setVerticalSpeed(targetVS);
              
              const nextAlt = landingAlt + (targetVS / 60 * dt * 5);
              
              // SOLID GROUND / COLLISION DETECTION
              if (nextAlt <= 0) {
                  setLandingAlt(0);
                  // Crash Conditions: 
                  // 1. High Sink Rate (> 500 fpm)
                  // 2. Off Center (> 120 ft)
                  // 3. Excessive Bank (> 10 deg)
                  // 4. Short of runway (landingDist > 6000 means still far out)
                  const isHardLanding = Math.abs(targetVS) > 500;
                  const isOffRunway = Math.abs(landingOffset) > 100;
                  const isBanked = Math.abs(landingRoll) > 15;
                  const isShort = landingDist > 6000; // Runway starts at 0, threshold at 0. If dist > 0 we are "short"?? No, dist is distance TO threshold.
                  // Actually distance decreases. If dist > 0 we are approaching. If dist < 0 we are over runway.
                  // Safe touch down zone: -500 to +1000 ? 
                  // Let's say if we hit ground before threshold (dist > 50), it's a crash.
                  
                  if (isHardLanding || isOffRunway || isBanked || landingDist > 100) {
                      setIsCrashed(true);
                      // Generate particles
                      const parts = [];
                      for(let i=0; i<30; i++) {
                          parts.push({
                              x: 0, y: 0, 
                              r: 10 + Math.random() * 20, 
                              c: ['#ff0000', '#ffaa00', '#ffff00'][Math.floor(Math.random()*3)],
                              v: {x: (Math.random()-0.5)*10, y: (Math.random()-0.5)*10}
                          });
                      }
                      setExplosionParticles(parts);
                      playSound('click'); // Reuse click for now
                  } else {
                      setIsCompleted(true);
                      playSound('click');
                  }
              } else {
                  setLandingAlt(nextAlt);
              }

              const windDrift = (windDir === 'left' ? 1 : -1) * (windSpeed * 0.5 * dt); 
              const headingDrift = (landingYaw * Math.PI / 180) * speed * dt;
              const bankDrift = -(landingRoll * Math.PI / 180) * speed * 0.5 * dt;
              const totalLateralMove = windDrift + headingDrift + bankDrift;
              
              setLandingOffset(prev => prev + totalLateralMove);
          }
          
          if (isCrashed) {
              setExplosionParticles(prev => prev.map(p => ({
                  ...p,
                  x: p.x + p.v.x,
                  y: p.y + p.v.y,
                  r: p.r * 0.95
              })).filter(p => p.r > 0.5));
          }
          
          renderLandingScene(ctx, canvas);
          animationFrameId = requestAnimationFrame(update);
          return; 
      }

      // STANDARD VOR/HSI LOOP (Existing Logic)
      if (!isPaused && !showPassageExplanation && !isCompleted && !showPTSelection && !courseChangeAlert) {
        
        // Handle Engine Trouble
        if (isHomingMission && engineHealth > 40) {
            const runtime = pathRef.current.length;
            if (runtime > 200) {
                setEngineHealth(prev => Math.max(40, prev - 0.05));
                if (!emergencyAlert && runtime > 300) {
                    setEmergencyAlert(true);
                    playSound('click');
                }
            }
        }

        setPlanePos(prev => {
          const rad = (heading - 90) * (Math.PI / 180);
          const drift = (velocity > 0 && !isHomingMission) ? crosswindX : 0; // Disable constant drift in homing to focus on raw nav
          
          // Engine trouble reduces performance
          const powerLoss = isHomingMission && engineHealth < 100 ? (engineHealth / 100) : 1;
          const currentVel = velocity * powerLoss;

          const newX = prev.x + Math.cos(rad) * currentVel + drift;
          const newY = prev.y + Math.sin(rad) * currentVel;
          
          const lastPoint = pathRef.current[pathRef.current.length - 1];
          if (!lastPoint || Math.hypot(lastPoint.x - newX, lastPoint.y - newY) > 5) {
            pathRef.current.push({ x: newX, y: newY });
          }

          const dx = newX - stationPos.x;
          const dy = newY - stationPos.y;
          const distToStation = Math.hypot(dx, dy) / 100;

          // VOR Logic
          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          while (angle < 0) angle += 360;
          while (angle >= 360) angle -= 360;
          const currentRadial = Math.round(angle);
          setRadial(currentRadial);

          let diff = obs - currentRadial;
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;
          
          const isActuallyTo = Math.abs(diff) > 90;
          setIsOff(distToStation < 0.25);

          // Calculate current CDI Deflection for Logic
          let cdiError = diff;
          if (isActuallyTo) {
            let toDiff = diff + (diff > 0 ? -180 : 180);
            cdiError = -toDiff;
          }
          const currentCdiDeflection = Math.max(-10, Math.min(10, cdiError)) / 10;
          setCdiDeflection(currentCdiDeflection);

          if (isOutboundMission) {
              // Phase 1: Outbound Leg on R-170
              // CHANGED: Trigger distance moved from 5.0 to 6.0 DME
              if (phase === 'OUTBOUND' && distToStation >= 6.0) {
                  // AUTO TUNE LOGIC
                  setObs(160); // Tune HSI to 160 as requested
                  // CHANGED: Heading Bug set to 215 degrees (Right turn intercept)
                  const interceptHdg = 215; 
                  setHeadingBug(interceptHdg); 
                  
                  // Pause and Alert
                  setCourseChangeAlert(true);
                  playSound('click');
                  setPhase('INTERCEPT');
                  setIsPaused(true); // Pause sim so they can read checkpoint info
                  return prev;
              }

              // Phase 2: Intercept
              if (phase === 'INTERCEPT') {
                  // Wait for user to set OBS to 160 and be somewhat centered
                  if (obs === 160 && Math.abs(currentCdiDeflection) < 0.8) {
                      setPhase('TRACKING');
                      setInboundEstablishedAlert(true);
                      setTimeout(() => setInboundEstablishedAlert(false), 3000);
                  }
              }

              // Phase 3: Track to Fix WM01 (15 DME on R-160)
              // CHANGED: Completion distance moved from 10.0 to 15.0 DME
              if (phase === 'TRACKING' && distToStation >= 15.0) {
                  if (Math.abs(currentCdiDeflection) < 0.2) {
                      setIsCompleted(true);
                  }
              }
          }

          if (isInboundInterceptMission) {
              // 1. OUTBOUND LEG to 5 DME
              if (phase === 'OUTBOUND' && distToStation >= 5.0) {
                  // Trigger the Selection Modal instead of auto-switching
                  setIsPaused(true);
                  setShowPTSelection(true);
                  playSound('click');
                  // We return prev here so the plane doesn't keep moving while we decide
                  return prev;
              }

              // 2. PROCEDURE TURN & INBOUND CAPTURE
              if (phase === 'PROC_TURN') {
                   // === TIMER LOGIC START ===
                   if (timerRef.current === null && !ptTurnCompleteRef.current) {
                        // Check if established on outbound leg (heading matches bug)
                        let headingDiff = Math.abs(heading - headingBug);
                        if (headingDiff > 180) headingDiff = 360 - headingDiff;
                        
                        if (headingDiff < 5) {
                             timerRef.current = 45; // Start at 45 seconds
                             setPtTimerDisplay(45);
                             playSound('click');
                        }
                   } else if (timerRef.current !== null) {
                        // Decrement timer FASTER than real time (0.05 per frame ~= 3x speed)
                        timerRef.current -= 0.05;
                        
                        if (timerRef.current <= 0) {
                            timerRef.current = null;
                            ptTurnCompleteRef.current = true;
                            setPtTimerDisplay(null);
                            setTurnInboundAlert(true);
                            // Change course: 180 degree turn to intercept inbound
                            setHeadingBug(prevBug => (prevBug + 180) % 360);
                            playSound('click');
                        } else {
                            // Update display only if integer value changes to reduce renders
                            const displayVal = Math.ceil(timerRef.current);
                            if (displayVal !== ptTimerDisplay) {
                                setPtTimerDisplay(displayVal);
                            }
                        }
                   }

                   // Turn Inbound Alert Clear Logic
                   if (turnInboundAlert) {
                        let alertDiff = Math.abs(heading - headingBug);
                        if (alertDiff > 180) alertDiff = 360 - alertDiff;
                        // Clear alert when user starts turning (within 10 deg of target)
                        if (alertDiff < 10) setTurnInboundAlert(false);
                   }

                   // === CDI GUIDANCE LOGIC ===
                   if (ptTurnCompleteRef.current && !turnInboundAlert) {
                       // We are on the intercept heading. Monitor CDI.
                       // Full deflection is +/- 1.0. 
                       // "Alive" means it moves off the peg (< 0.95 or so).
                       if (Math.abs(currentCdiDeflection) < 0.95) {
                           if (Math.abs(currentCdiDeflection) < 0.15) {
                                setCdiMessage("INTERCEPT: TURN INBOUND (270°)");
                           } else {
                                setCdiMessage("CDI ALIVE: WAIT FOR CENTER...");
                           }
                       } else {
                           setCdiMessage(null);
                       }
                   }

                   // === PHASE CHANGE LOGIC ===
                   if (Math.abs(newY - stationPos.y) < 300) {
                       let hdgDiff = Math.abs(heading - 270);
                       if (hdgDiff > 180) hdgDiff = 360 - hdgDiff;
                       
                       if (hdgDiff < 60) {
                           setPhase('INBOUND_TRACK');
                           setInboundEstablishedAlert(true);
                           setTurnInboundAlert(false);
                           setCdiMessage(null); // Clear message
                           playSound('click');
                           setTimeout(() => setInboundEstablishedAlert(false), 4000);
                       }
                   }
              }

              // 3. INBOUND TO STATION
              if (phase === 'INBOUND_TRACK' && distToStation < 0.5) {
                  setIsCompleted(true);
              }

          } else if (isHomingMission) {
             if (distToStation < 0.3) {
                setIsCompleted(true);
             }
          } else if (!isOutboundMission) {
             // Standard Radial Mission Logic (f-vor)
             if (phase === 'INBOUND' && distToStation < 0.5) {
                setShowPassageExplanation(true);
                setIsPaused(true);
                return prev;
             }
             if (phase === 'INBOUND' && !isActuallyTo) {
                setPhase('OUTBOUND');
                setPassAlert(true);
                playSound('click');
                setTimeout(() => setPassAlert(false), 4000);
             }
             if (phase === 'OUTBOUND' && distToStation >= 12.0 && Math.abs(currentRadial - 360) < 5) {
                setIsCompleted(true);
             }
          }
          
          setIsTo(isActuallyTo);
          return { x: newX, y: newY };
        });
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // BACKGROUND COLORS
      ctx.fillStyle = isHomingMission ? '#2d4c1e' : '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(centerX, centerY);

      // RENDER ENVIRONMENT FEATURES
      if (isHomingMission) {
          envFeatures.forEach(feat => {
              const drawX = feat.x - planePos.x;
              const drawY = feat.y - planePos.y;
              
              // Only draw if on screen
              if (Math.abs(drawX) < 1000 && Math.abs(drawY) < 1000) {
                  if (feat.type === 'tree') {
                      ctx.fillStyle = '#1e3314';
                      ctx.beginPath(); ctx.arc(drawX, drawY, feat.size, 0, Math.PI * 2); ctx.fill();
                      ctx.fillStyle = '#26421a';
                      ctx.beginPath(); ctx.arc(drawX - 2, drawY - 2, feat.size * 0.7, 0, Math.PI * 2); ctx.fill();
                  } else if (feat.type === 'bush') {
                      ctx.fillStyle = '#3a5a2b';
                      ctx.beginPath(); ctx.arc(drawX, drawY, feat.size, 0, Math.PI * 2); ctx.fill();
                  } else if (feat.type === 'dirt') {
                      ctx.save();
                      ctx.translate(drawX, drawY);
                      ctx.rotate(feat.rotation || 0);
                      ctx.fillStyle = '#4a3c2a';
                      ctx.fillRect(-feat.size/2, -feat.size/4, feat.size, feat.size/2);
                      ctx.restore();
                  }
              }
          });

          // Draw Roads
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 40;
          ctx.beginPath();
          ctx.moveTo(-10000 - planePos.x, -10000 - planePos.y);
          ctx.lineTo(10000 - planePos.x, -10000 - planePos.y);
          ctx.stroke();
      }

      // Grid (More subtle in homing)
      ctx.strokeStyle = isHomingMission ? '#ffffff04' : '#ffffff06';
      ctx.lineWidth = 1;
      const gridSize = 150;
      const startX = Math.floor((planePos.x - centerX) / gridSize) * gridSize;
      const startY = Math.floor((planePos.y - centerY) / gridSize) * gridSize;

      for (let x = startX - 2000; x < startX + 2000; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x - planePos.x, -15000); ctx.lineTo(x - planePos.x, 15000); ctx.stroke();
      }
      for (let y = startY - 2000; y < startY + 2000; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(-15000, y - planePos.y); ctx.lineTo(15000, y - planePos.y); ctx.stroke();
      }

      // Trail
      ctx.save();
      ctx.strokeStyle = '#ef4444'; 
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pathRef.current.forEach((p, i) => {
        const drawX = p.x - planePos.x;
        const drawY = p.y - planePos.y;
        if (i === 0) ctx.moveTo(drawX, drawY); else ctx.lineTo(drawX, drawY);
      });
      ctx.lineTo(0, 0); 
      ctx.stroke();
      ctx.restore();

      // STATION / AIRPORT RENDERING
      const sX = stationPos.x - planePos.x;
      const sY = stationPos.y - planePos.y;

      if (isHomingMission) {
          // Draw Airport / Runway
          ctx.fillStyle = '#111';
          ctx.fillRect(sX - 40, sY - 300, 80, 600);
          
          // Markings
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([20, 20]);
          ctx.beginPath(); ctx.moveTo(sX, sY - 250); ctx.lineTo(sX, sY + 250); ctx.stroke();
          ctx.setLineDash([]);
          
          // Thresholds
          ctx.fillRect(sX - 35, sY - 290, 70, 10);
          ctx.fillRect(sX - 35, sY + 280, 70, 10);
          
          // Identifier
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 20px "Share Tech Mono"';
          ctx.fillText("36", sX - 10, sY + 270);
          
          // Airport Label
          ctx.font = 'black 12px "Share Tech Mono"';
          ctx.fillText("CENTRAL AIRPORT (VOR: WMT)", sX + 50, sY);
      } else {
          // Standard VOR Station
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(sX, sY); ctx.lineTo(sX, sY + 10000); ctx.moveTo(sX, sY); ctx.lineTo(sX, sY - 10000); ctx.stroke();
      }

      // Station Beacon
      const gradient = ctx.createRadialGradient(sX, sY, 0, sX, sY, 40);
      gradient.addColorStop(0, 'rgba(255, 204, 0, 0.3)'); gradient.addColorStop(1, 'rgba(255, 204, 0, 0)');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(sX, sY, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFCC00'; ctx.beginPath(); ctx.arc(sX, sY, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sX, sY, 20, 0, Math.PI * 2); ctx.stroke();

      ctx.restore();

      // Plane on Canvas
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(heading * (Math.PI / 180));
      
      if (aircraftImgRef.current) {
        const size = 60; 
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00FFFF';
        ctx.drawImage(aircraftImgRef.current, -size/2, -size/2, size, size);
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, isCompleted, heading, velocity, obs, planePos, stationPos, phase, showPassageExplanation, engineHealth, emergencyAlert, isHomingMission, isInboundInterceptMission, showPTSelection, headingBug, turnInboundAlert, ptTimerDisplay, isLandingMission, landingAlt, landingDist, landingOffset, landingYaw, landingRoll, landingPitch, verticalSpeed, windSpeed, windDir, isOutboundMission, courseChangeAlert, isCrashed, explosionParticles]);

  // Review Map Drawing Effect
  useEffect(() => {
    if (!showReviewMap || !reviewCanvasRef.current) return;
    const canvas = reviewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = isHomingMission ? '#1e3314' : '#080808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 60;
    let minX = stationPos.x, maxX = stationPos.x, minY = stationPos.y, maxY = stationPos.y;
    pathRef.current.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });

    minX = Math.min(minX, planePos.x);
    maxX = Math.max(maxX, planePos.x);
    minY = Math.min(minY, planePos.y);
    maxY = Math.max(maxY, planePos.y);

    const dataWidth = maxX - minX || 1;
    const dataHeight = maxY - minY || 1;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);
    const offsetX = (availableWidth - dataWidth * scale) / 2 + padding;
    const offsetY = (availableHeight - dataHeight * scale) / 2 + padding;

    const mapX = (x: number) => (x - minX) * scale + offsetX;
    const mapY = (y: number) => (y - minY) * scale + offsetY;

    // Draw Flight Path
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pathRef.current.forEach((p, i) => {
        if (i === 0) ctx.moveTo(mapX(p.x), mapY(p.y));
        else ctx.lineTo(mapX(p.x), mapY(p.y));
    });
    ctx.lineTo(mapX(planePos.x), mapY(planePos.y));
    ctx.stroke();

    // Draw Station Marker
    const sX = mapX(stationPos.x);
    const sY = mapY(stationPos.y);
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath(); ctx.arc(sX, sY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sX, sY, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px "Share Tech Mono"'; 
    ctx.fillText(isHomingMission ? "TARGET AIRPORT" : "VOR STATION", sX + 18, sY + 4);

    // Draw Outbound Fix WM01 (if outbound mission)
    if (isOutboundMission) {
        // WM01 is 15 DME on R-160 (UPDATED from 10 DME)
        // R-160 is (160-90) = 70 degrees rad from normal unit circle logic, but we use (heading-90)
        // 160 deg from North.
        const wm01Rad = (160 - 90) * (Math.PI / 180);
        // Scale factor: DME * 100
        const wm01Dist = 1500; // 15.0 DME scaled
        const wm01X = stationPos.x + Math.cos(wm01Rad) * wm01Dist;
        const wm01Y = stationPos.y + Math.sin(wm01Rad) * wm01Dist;
        
        const fixX = mapX(wm01X);
        const fixY = mapY(wm01Y);
        
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath(); ctx.moveTo(fixX, fixY - 6); ctx.lineTo(fixX + 5, fixY + 4); ctx.lineTo(fixX - 5, fixY + 4); ctx.fill();
        ctx.font = 'bold 10px "Share Tech Mono"';
        ctx.fillText("WM01", fixX + 8, fixY);
        
        // Draw Leg Lines
        ctx.strokeStyle = '#00FFFF';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        // R-170 line to 5 DME
        // R-160 line
        ctx.beginPath(); 
        ctx.moveTo(sX, sY); 
        ctx.lineTo(fixX, fixY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

  }, [showReviewMap, isHomingMission, isOutboundMission]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPassageExplanation || isCompleted || showPTSelection || courseChangeAlert || isCrashed) return;
      if (isPaused) {
        if (e.key === 'Enter' || e.key === ' ') setIsPaused(false);
        return;
      }
      
      // Landing Mission Controls
      if (isLandingMission) {
          // New Scheme:
          // Left/Right Arrow: Yaw (Rudder)
          // Up/Down Arrow: Pitch (Elevator) - Up = Down, Down = Up (Standard Sim)
          // A/D: Bank (Aileron)
          if (e.key === 'ArrowLeft') setLandingYaw(y => y + 2); // Left Turn
          if (e.key === 'ArrowRight') setLandingYaw(y => y - 2); // Right Turn
          if (e.key === 'ArrowUp') setLandingPitch(p => Math.max(-10, p - 1)); // Nose Down
          if (e.key === 'ArrowDown') setLandingPitch(p => Math.min(10, p + 1)); // Nose Up
          
          if (e.key === 'a' || e.key === 'A') setLandingRoll(r => Math.max(-45, r - 2)); // Bank Left
          if (e.key === 'd' || e.key === 'D') setLandingRoll(r => Math.min(45, r + 2)); // Bank Right
          return;
      }

      if (e.key === 'ArrowLeft') handleSteer('left');
      if (e.key === 'ArrowRight') handleSteer('right');
      if (e.key === 'q' || e.key === 'Q') { setObs(o => (o - 1 + 360) % 360); }
      if (e.key === 'e' || e.key === 'E') { setObs(o => (o + 1) % 360); }
      if (e.key === '[') { setHeadingBug(h => (h - 1 + 360) % 360); }
      if (e.key === ']') { setHeadingBug(h => (h + 1) % 360); }
      if (e.key === 'w' || e.key === 'W') handleThrottle('up');
      if (e.key === 's' || e.key === 'S') handleThrottle('down');
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            setTurnRate(0);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused, isCompleted, obs, heading, velocity, steerCombo, showPassageExplanation, showPTSelection, isLandingMission, courseChangeAlert, isCrashed]);

  const handleSteer = (dir: 'left' | 'right') => {
    const now = Date.now();
    let newCount = 1;
    if (steerCombo.dir === dir && now - steerCombo.lastTime < 400) newCount = steerCombo.count + 1;
    const delta = newCount > 2 ? 4 : 2;
    const newHdg = dir === 'left' ? (heading - delta + 360) % 360 : (heading + delta) % 360;
    setHeading(newHdg);
    // Set Turn Rate for HSI Indicator (+ for right, - for left)
    setTurnRate(dir === 'left' ? -delta : delta);
    setSteerCombo({ dir, count: newCount, lastTime: now });
  };

  const handleThrottle = (dir: 'up' | 'down') => {
    setVelocity(v => (dir === 'up' ? Math.min(5, v + 0.1) : Math.max(0, v - 0.1)));
  };

  const syncHeadingBug = () => { playSound('click'); setHeadingBug(heading); };

  const centerCDI = () => {
    playSound('click');
    // This function calculates the reciprocal of the current radial to set a direct course TO the station.
    // This is the standard procedure for "homing" using a VOR.
    const reciprocal = radial < 180 ? radial + 180 : radial - 180;
    setObs(reciprocal);
  };

  const handleProcedureTurnSelection = (direction: 'left' | 'right') => {
      playSound('click');
      const outboundHeading = 90; // Fixed for this scenario (R-090 outbound)
      const offset = 45;
      
      // Reset timer logic
      timerRef.current = null;
      ptTurnCompleteRef.current = false;
      setPtTimerDisplay(null);
      setCdiMessage(null);
      
      // Calculate new heading based on 45 degree intercept
      // Left Turn: 90 - 45 = 45
      // Right Turn: 90 + 45 = 135
      const newBug = direction === 'left' 
        ? (outboundHeading - offset + 360) % 360 
        : (outboundHeading + offset) % 360;
      
      setHeadingBug(newBug);
      setPhase('PROC_TURN');
      setPtAlert(true);
      setTimeout(() => setPtAlert(false), 5000);
      
      setShowPTSelection(false);
      setIsPaused(false);
  };

  const closeExplanation = () => {
      playSound('click');
      setPhase('OUTBOUND');
      setIsTo(false);
      setShowPassageExplanation(false);
      setIsPaused(false);
  };

  const renderTurnCoordinator = () => (
    <div className="relative w-56 h-56 bg-[#1a1a1c] rounded-xl shadow-2xl flex items-center justify-center p-2 select-none mt-4 border-[4px] border-[#2a2a2c]">
        {/* Screws */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#0a0a0c] shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0a0a0c] shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#0a0a0c] shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#0a0a0c] shadow-[0_1px_0_rgba(255,255,255,0.1)]"></div>

        {/* Gauge Face */}
        <div className="relative w-48 h-48 rounded-full bg-black border-2 border-zinc-800 shadow-inner flex flex-col items-center overflow-hidden">
            
            {/* Top Text */}
            <div className="absolute top-8 flex flex-col items-center">
                <span className="text-[8px] text-white font-bold leading-none">D.C.</span>
                <span className="text-[8px] text-white font-bold leading-none mt-0.5">ELEC</span>
            </div>

            {/* Turn Index Marks */}
            <div className="absolute top-1/2 w-full px-2 -translate-y-[2px]">
                 {/* Left Wing Mark */}
                 <div className="absolute left-3 top-0 w-8 h-1 bg-white"></div>
                 {/* Right Wing Mark */}
                 <div className="absolute right-3 top-0 w-8 h-1 bg-white"></div>
                 
                 {/* Standard Rate Marks (Dog ears) - usually lower for turn */}
                 {/* Usually standard rate is when wing tip touches the lower mark */}
                 <div className="absolute left-3 top-4 w-2 h-1 bg-white"></div> 
                 <div className="absolute right-3 top-4 w-2 h-1 bg-white"></div>
                 
                 {/* L / R Labels */}
                 <span className="absolute left-4 top-8 text-xs font-bold text-white">L</span>
                 <span className="absolute right-4 top-8 text-xs font-bold text-white">R</span>
            </div>

            {/* The Miniature Airplane */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                 <div className="transition-transform duration-300 ease-out" style={{ transform: `rotate(${turnRate * 5}deg)` }}>
                      {/* Airplane SVG */}
                      <svg width="120" height="30" viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Left Wing */}
                          <rect x="0" y="12" width="45" height="6" fill="white" />
                          {/* Right Wing */}
                          <rect x="75" y="12" width="45" height="6" fill="white" />
                          {/* Fuselage (Circle) */}
                          <circle cx="60" cy="15" r="8" fill="white" />
                          {/* Tail (Vertical Stabilizer view) */}
                          <rect x="58" y="0" width="4" height="15" fill="white" />
                      </svg>
                 </div>
            </div>

            {/* Center Text */}
            <div className="absolute top-[55%] text-[7px] text-white font-bold tracking-wider uppercase">TURN COORDINATOR</div>

            {/* Inclinometer (Ball) */}
            <div className="absolute bottom-10 w-32 h-6 relative">
                 {/* Tube curve simulation: We can use a curved border or SVG */}
                 <svg width="100%" height="100%" viewBox="0 0 128 24">
                    <path d="M4,4 Q64,24 124,4" fill="none" stroke="#333" strokeWidth="18" strokeLinecap="round" />
                    <path d="M4,4 Q64,24 124,4" fill="none" stroke="black" strokeWidth="14" strokeLinecap="round" />
                 </svg>
                 {/* The Ball */}
                 <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-white shadow-inner transition-transform duration-500 ease-out mb-2"
                           style={{ transform: `translateX(${-turnRate * 8}px) translateY(${Math.abs(turnRate)}px)` }}></div> 
                 </div>
                 {/* Center lines on tube */}
                 <div className="absolute top-0 left-1/2 -translate-x-2 w-px h-full bg-zinc-500"></div>
                 <div className="absolute top-0 left-1/2 translate-x-2 w-px h-full bg-zinc-500"></div>
            </div>

            {/* 2 MIN Text */}
            <div className="absolute bottom-6 text-[8px] text-white font-bold">2 MIN</div>

            {/* Bottom Warning */}
            <div className="absolute bottom-2 text-[6px] text-white font-bold uppercase tracking-wider opacity-80">NO PITCH INFORMATION</div>
            
        </div>
    </div>
  );

  const renderInstrument = () => {
    // If landing mission, we hide the HSI/VOR controls for simplicity in this specific view
    if (isLandingMission) {
        return (
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-64 shadow-2xl">
                <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4 border-b border-white/10 pb-2">Landing Controls</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-bold">PITCH / YAW</span>
                        <div className="grid grid-cols-3 gap-1 w-16">
                            <div></div>
                            <span className="w-5 h-5 bg-black rounded flex items-center justify-center text-[10px] font-mono border border-white/20">▲</span>
                            <div></div>
                            <span className="w-5 h-5 bg-black rounded flex items-center justify-center text-[10px] font-mono border border-white/20">◄</span>
                            <span className="w-5 h-5 bg-black rounded flex items-center justify-center text-[10px] font-mono border border-white/20">▼</span>
                            <span className="w-5 h-5 bg-black rounded flex items-center justify-center text-[10px] font-mono border border-white/20">►</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-bold">BANK (ROLL)</span>
                        <div className="flex gap-1">
                            <span className="w-6 h-6 bg-black rounded flex items-center justify-center text-xs font-mono border border-white/20">A</span>
                            <span className="w-6 h-6 bg-black rounded flex items-center justify-center text-xs font-mono border border-white/20">D</span>
                        </div>
                    </div>
                    <div className="text-[9px] text-zinc-500 mt-2 leading-tight">
                        <strong>CROSSWIND:</strong> Use Rudder (Arrows) to Crab. Use Bank (A/D) to Sideslip. Adjust Pitch (Up/Down) for Glide.
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'VOR') {
      return (
        <div className="flex flex-col items-center">
            <div className="relative group w-fit select-none">
            <div className="bg-[#1a1a1c] border-[8px] border-zinc-900 p-5 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-3 relative">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
                    <span className="text-[7px] font-black text-zinc-400 tracking-[0.3em] uppercase">BENDIX KING NXi</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
                </div>
                <div className="relative mt-4 w-56 h-56 rounded-full bg-[#080808] border-[8px] border-zinc-800 shadow-[inset_0_0_30px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0" style={{ transform: `rotate(${-obs}deg)` }}>
                    {[...Array(72)].map((_, i) => {
                    const deg = i * 5;
                    const isLarge = deg % 30 === 0;
                    const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : (deg / 10).toString();
                    return (
                        <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px flex flex-col items-center" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className={`w-px ${isLarge ? 'h-4 bg-white/90' : 'h-1.5 bg-white/30'}`}></div>
                        {isLarge && (
                            <span className="text-[11px] mt-4 font-black text-white transform" style={{ transform: `rotate(${-deg}deg)` }}>
                            {label}
                            </span>
                        )}
                        </div>
                    );
                    })}
                </div>
                <div className="relative w-full h-full flex items-center justify-center z-10 pointer-events-none">
                    <div className="flex gap-10 items-center">
                    <div className="flex gap-4"><div className="w-2 h-2 rounded-full border-2 border-white/20"></div><div className="w-2 h-2 rounded-full border-2 border-white/20"></div></div>
                    <div className="w-10 h-10 rounded-full border-[3px] border-white/20 flex items-center justify-center relative">
                        <img src={AIRCRAFT_IMG_URL} className="w-8 h-8 object-contain filter brightness-125" alt="Airplane" />
                    </div>
                    <div className="flex gap-4"><div className="w-2 h-2 rounded-full border-2 border-white/20"></div><div className="w-2 h-2 rounded-full border-2 border-white/20"></div></div>
                    </div>
                    <div className="absolute h-44 w-2 bg-[#ffffff] shadow-[4px_0_15px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden" 
                        style={{ transform: `translateX(${cdiDeflection * 75}px)` }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-black/20"></div>
                    </div>
                    <div className="absolute top-[28%] bg-zinc-900 border-2 border-zinc-800 w-12 h-10 rounded shadow-inner flex flex-col items-center justify-center overflow-hidden">
                    {isOff ? (
                        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#ff0000,#ff0000_4px,#ffffff_4px,#ffffff_8px)] opacity-80 animate-pulse"></div>
                    ) : (
                        <div className={`w-0 h-0 border-x-[10px] border-x-transparent transition-transform duration-300
                            ${isTo
                                ? 'border-b-[15px] border-b-g1000-green' // TO arrow
                                : 'border-t-[15px] border-t-white' // FROM arrow
                            }
                        `}></div>
                    )}
                    </div>
                </div>
                </div>
                <div className="bg-black/80 border border-white/10 px-3 py-1 rounded-md mt-2 flex items-center gap-2">
                <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">COURSE</span>
                <span className="text-[12px] font-mono font-black text-g1000-cyan tracking-widest">{obs.toString().padStart(3, '0')}°</span>
                </div>
            </div>
            </div>
            {renderTurnCoordinator()}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <div className="relative group w-fit">
            <div className="bg-[#111113] border-[6px] border-zinc-900 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4">
            <div className="flex justify-between w-full px-2 mb-2">
                <button onClick={syncHeadingBug} className="bg-black border border-white/40 px-3 py-1 rounded flex items-center gap-2 hover:bg-zinc-800 transition-colors group/sync">
                <span className="text-[9px] text-g1000-cyan font-black uppercase tracking-tighter">HDG</span>
                <span className="text-g1000-cyan font-mono text-xs font-black">{Math.round(headingBug).toString().padStart(3, '0')}°</span>
                <RefreshCw className="w-2.5 h-2.5 text-g1000-cyan/40 group-hover/sync:rotate-180 transition-transform" />
                </button>
                <div className="flex flex-col items-center justify-center">
                <div className="bg-black border-2 border-white px-3 py-1 rounded shadow-lg"><span className="text-white font-mono text-base font-black tracking-tighter">{Math.round(heading).toString().padStart(3, '0')}°</span></div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white mt-1"></div>
                </div>
            </div>
            <div className="relative w-64 h-64 rounded-full bg-[#1e140d] border-[8px] border-zinc-800 shadow-[inset_0_0_40px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                
                {/* Lubber Line - Fixed */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-white drop-shadow-md"></div>
                    <div className="w-0.5 h-2 bg-white -mt-0.5 shadow-sm"></div>
                </div>

                <div className="absolute inset-0" style={{ transform: `rotate(${-heading}deg)` }}>
                {[...Array(72)].map((_, i) => {
                    const deg = i * 5;
                    const isLarge = deg % 30 === 0;
                    const label = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : (deg / 10).toString();
                    return (
                        <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px flex flex-col items-center" style={{ transform: `rotate(${deg}deg)` }}>
                        <div className={`w-px ${isLarge ? 'h-4 bg-white' : 'h-1.5 bg-white/40'}`}></div>
                        {(deg % 30 === 0) && (<span className="text-[11px] mt-4 font-black text-white transform" style={{ transform: `rotate(${-deg}deg)` }}>{label}</span>)}
                        </div>
                    );
                })}
                <div className="absolute inset-0" style={{ transform: `rotate(${headingBug}deg)` }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-4 bg-g1000-cyan/20 border-x-[3px] border-b-[3px] border-g1000-cyan rounded-b-sm shadow-[0_0_10px_cyan]"></div>
                </div>
                <div className="absolute inset-0" style={{ transform: `rotate(${obs}deg)` }}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-g1000-magenta shadow-[0_0_15px_magenta]"></div>
                    <div className="absolute top-1/2 left-1/2 h-24 w-[5px] bg-g1000-magenta shadow-[0_0_20px_magenta]" 
                            style={{ transform: `translate(calc(-50% + ${cdiDeflection * 70}px), -50%)` }}></div>
                        {/* TO/FROM Indicator */}
                        {!isOff && isTo && (
                            <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[8px] border-x-transparent border-b-[12px] border-b-white drop-shadow-md"></div>
                        )}
                        {!isOff && !isTo && (
                            <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[8px] border-x-transparent border-t-[12px] border-t-white drop-shadow-md"></div>
                        )}
                </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="flex gap-8 items-center">
                    <div className="flex gap-4"><div className="w-2 h-2 rounded-full border-2 border-white/60"></div><div className="w-2 h-2 rounded-full border-2 border-white/60"></div></div>
                    <div className="w-12 h-12 rounded-full border-[3px] border-white/30 flex items-center justify-center">
                        <img src={AIRCRAFT_IMG_URL} className="w-10 h-10 object-contain drop-shadow-[0_0_10px_white] filter brightness-150 contrast-125" alt="Aircraft" />
                    </div>
                    <div className="flex gap-4"><div className="w-2 h-2 rounded-full border-2 border-white/60"></div><div className="w-2 h-2 rounded-full border-2 border-white/60"></div></div>
                </div>
                </div>
            </div>
            </div>
        </div>
        {renderTurnCoordinator()}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-black flex flex-col font-mono text-white overflow-hidden relative">
      
      {/* PROCEDURE TURN TIMER OVERLAY */}
      {ptTimerDisplay !== null && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[80] animate-fade-in">
              <div className="bg-black/80 border border-g1000-magenta px-4 py-2 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(255,0,255,0.3)]">
                  <Clock className="w-4 h-4 text-g1000-magenta animate-pulse" />
                  <span className="text-xl font-mono font-black text-white tracking-widest">
                      00:{ptTimerDisplay.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pl-2 border-l border-white/10">OUTBOUND LEG</span>
              </div>
          </div>
      )}
      
      {/* TURN INBOUND ALERT */}
      {turnInboundAlert && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce">
              <div className="bg-g1000-magenta text-white px-10 py-5 rounded-2xl font-black tracking-[0.25em] uppercase shadow-[0_0_60px_magenta] text-center border-2 border-white">
                  TIME EXPIRED<br/>TURN INBOUND (180°)
              </div>
          </div>
      )}

      {/* COURSE CHANGE ALERT (6 DME) */}
      {courseChangeAlert && (
          <div className="absolute inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in pointer-events-auto p-4">
              <div className="max-w-2xl w-full bg-zinc-950 border-2 border-g1000-cyan p-8 rounded-3xl shadow-[0_0_100px_rgba(0,255,255,0.15)] flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <div className="p-3 bg-g1000-cyan/20 rounded-xl">
                          <Navigation2 className="w-8 h-8 text-g1000-cyan" />
                      </div>
                      <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-widest">Checkpoint: 6.0 DME</h3>
                          <p className="text-xs text-g1000-cyan font-bold uppercase tracking-[0.2em]">Course Change Maneuver</p>
                      </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
                      <p>
                          <strong className="text-white">Objective:</strong> Intercept and track Radial 160 outbound to fix WM01 (15 DME).
                      </p>
                      <div className="bg-zinc-900 p-4 rounded-xl border border-white/5">
                          <h4 className="text-g1000-amber font-bold text-xs uppercase tracking-wider mb-2">Navigation Theory: Outbound Intercepts</h4>
                          <p className="mb-2">
                              When changing radials outbound, the distance from the station dictates the intercept angle. 
                              Closer to the station, radials are tighter, requiring smaller angles. Further out, radials spread apart.
                          </p>
                          <p>
                              A standard intercept angle of <span className="text-white font-bold">45°</span> is typically used depending on the cross-track distance to ensure a timely capture without overshooting.
                          </p>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-g1000-cyan/10 p-4 rounded-xl border border-g1000-cyan/30">
                          <Info className="w-5 h-5 text-g1000-cyan shrink-0 mt-0.5" />
                          <div>
                              <p className="font-bold text-g1000-cyan text-xs uppercase mb-1">Automated Systems Update</p>
                              <ul className="list-disc pl-4 space-y-1 text-xs">
                                  <li>HSI Course (OBS) automatically tuned to <span className="text-white font-bold">160°</span>.</li>
                                  <li>Heading Bug set to <span className="text-white font-bold">215°</span> (45° Intercept Angle).</li>
                              </ul>
                          </div>
                      </div>

                      <p className="text-center font-bold text-white bg-red-900/30 border border-red-500/30 p-3 rounded-lg animate-pulse">
                          ACTION REQUIRED: TURN RIGHT IMMEDIATELY TO FOLLOW THE HEADING BUG (215°).
                      </p>
                  </div>

                  <button 
                    onClick={() => { setCourseChangeAlert(false); setIsPaused(false); }} 
                    className="w-full bg-g1000-cyan text-black font-black uppercase py-4 rounded-xl hover:brightness-110 shadow-lg tracking-widest text-sm"
                  >
                      Execute Maneuver
                  </button>
              </div>
          </div>
      )}

      {/* CDI ALIVE / INTERCEPT NOTIFICATION */}
      {cdiMessage && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 z-[90] animate-fade-in">
             <div className="bg-black/90 border-2 border-g1000-green px-8 py-4 rounded-xl shadow-[0_0_40px_rgba(0,255,0,0.3)] flex flex-col items-center">
                 <AlertCircle className="w-6 h-6 text-g1000-green mb-2 animate-pulse" />
                 <span className="text-lg font-black text-white tracking-widest uppercase text-center whitespace-pre-line">{cdiMessage}</span>
             </div>
          </div>
      )}

      {/* CDI EXPLANATION MODAL */}
      {showCdiExplanation && (
        <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in pointer-events-auto p-4">
             <div className="max-w-3xl w-full bg-[#111] border-2 border-g1000-cyan rounded-[2rem] shadow-[0_0_100px_rgba(0,255,255,0.2)] overflow-hidden flex flex-col">
                <div className="bg-g1000-cyan/10 p-6 flex justify-between items-center border-b border-g1000-cyan/30">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-g1000-cyan" />
                        <h2 className="text-xl font-black uppercase tracking-widest text-white">Avionics Theory: Centering the CDI</h2>
                    </div>
                    <button onClick={() => setShowCdiExplanation(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar max-h-[70vh] space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-g1000-amber font-black uppercase tracking-widest text-sm mb-2">Traditional VOR</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    A VOR (Omni) is position-sensitive but not heading-sensitive. If the CDI is centered with a <span className="text-g1000-green font-bold">TO</span> flag, the OBS displays the <strong>Magnetic Bearing to the Station</strong>. In an emergency, you center the needle to instantly find your required course to safety.
                                </p>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-g1000-magenta font-black uppercase tracking-widest text-sm mb-2">Digital HSI</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    The HSI combines the compass and VOR. Centering the course needle aligns the "Course Arrow" with your current bearing. This allows for <strong>Command Steering</strong>—simply overlaying the aircraft icon on the needle to fly direct.
                                </p>
                            </div>
                        </div>
                        <div className="bg-black/40 p-6 rounded-2xl border border-dashed border-zinc-800 flex flex-col justify-center">
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-4 text-center">Emergency "Direct-To" Logic</h4>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-g1000-green shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-zinc-300">Centering the CDI eliminates mental geometry during high-stress failure events.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-g1000-green shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-zinc-300">It provides a precise radial to track, ensuring crosswind drift is immediately visible.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-g1000-green shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-zinc-300">For {type} specifically, it allows the pilot to focus solely on glide slope and airspeed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-zinc-950 p-6 border-t border-white/5">
                    <button onClick={() => setShowCdiExplanation(false)} className="w-full bg-g1000-cyan text-black py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-[0.98] transition-all">Understood, Returning to Cockpit</button>
                </div>
             </div>
        </div>
      )}

      {/* PROCEDURE TURN SELECTION MODAL */}
      {showPTSelection && (
          <div className="absolute inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
              <div className="max-w-xl w-full bg-zinc-950 border-2 border-g1000-cyan p-8 rounded-3xl shadow-[0_0_100px_rgba(0,255,255,0.15)] flex flex-col gap-6 text-center">
                  <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-g1000-cyan/10 flex items-center justify-center mb-4">
                          <Navigation2 className="w-8 h-8 text-g1000-cyan" />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest">5.0 DME Reached</h3>
                      <p className="text-xs text-g1000-cyan font-bold uppercase tracking-[0.2em] mt-1">Decision Checkpoint: Procedure Turn</p>
                      <p className="text-zinc-500 text-sm mt-4 leading-relaxed max-w-sm">
                          You have reached the outbound limit. Select the direction for your course reversal. The Flight Director will automatically set the heading bug for a 45° intercept.
                      </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                      <button 
                        onClick={() => handleProcedureTurnSelection('left')}
                        className="group flex flex-col items-center gap-3 bg-zinc-900 border border-white/10 hover:border-g1000-green hover:bg-g1000-green/10 p-6 rounded-2xl transition-all active:scale-95"
                      >
                          <CornerUpLeft className="w-8 h-8 text-zinc-500 group-hover:text-g1000-green transition-colors" />
                          <div>
                            <span className="block text-sm font-black text-white uppercase tracking-wider">Turn Left</span>
                            <span className="block text-[10px] text-zinc-500 font-mono mt-1 group-hover:text-g1000-green">HDG 045° (Standard)</span>
                          </div>
                      </button>

                      <button 
                        onClick={() => handleProcedureTurnSelection('right')}
                        className="group flex flex-col items-center gap-3 bg-zinc-900 border border-white/10 hover:border-g1000-magenta hover:bg-g1000-magenta/10 p-6 rounded-2xl transition-all active:scale-95"
                      >
                          <CornerUpRight className="w-8 h-8 text-zinc-500 group-hover:text-g1000-magenta transition-colors" />
                          <div>
                            <span className="block text-sm font-black text-white uppercase tracking-wider">Turn Right</span>
                            <span className="block text-[10px] text-zinc-500 font-mono mt-1 group-hover:text-g1000-magenta">HDG 135° (Non-Std)</span>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* COMPLETION MODAL */}
      {(isCompleted || isCrashed) && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in pointer-events-auto">
            <div className={`max-w-4xl w-full bg-[#111] border-4 ${isCrashed ? 'border-red-600' : 'border-g1000-green'} p-10 rounded-[3rem] shadow-[0_0_120px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6 relative`}>
                
                {showReviewMap && !isCrashed ? (
                  <div className="w-full flex flex-col items-center animate-fade-in">
                    <div className="flex items-center justify-between w-full mb-6">
                        <div className="flex items-center gap-3">
                            <Map className="w-6 h-6 text-g1000-cyan" />
                            <h2 className="text-2xl font-black uppercase tracking-widest">Flight Track Review</h2>
                        </div>
                        <button onClick={() => setShowReviewMap(false)} className="bg-zinc-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-white/10 hover:bg-zinc-700 transition-colors">Back to Stats</button>
                    </div>
                    <div className="w-full aspect-video bg-black rounded-3xl border-2 border-white/5 overflow-hidden shadow-inner relative group">
                        <canvas ref={reviewCanvasRef} width={800} height={450} className="w-full h-full object-contain" />
                        <div className="absolute bottom-4 left-6 flex flex-col gap-1 pointer-events-none">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ef4444] rounded-sm"></div><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">YOUR FLIGHT PATH</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-g1000-cyan/10 border border-g1000-cyan/30 rounded-sm"></div><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">TARGET {isHomingMission ? "AIRPORT" : "RADIAL"}</span></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6 w-full mt-8">
                         <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5"><span className="block text-[8px] text-zinc-600 uppercase mb-1">Total Distance</span><span className="text-xl font-black text-white">{(pathRef.current.length * 0.05).toFixed(1)} NM</span></div>
                         <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5"><span className="block text-[8px] text-zinc-600 uppercase mb-1">Max Deviation</span><span className="text-xl font-black text-g1000-amber">{isHomingMission ? "N/A" : "0.4 NM"}</span></div>
                         <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5"><span className="block text-[8px] text-zinc-600 uppercase mb-1">Avg Groundspeed</span><span className="text-xl font-black text-g1000-green">140 KTS</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center animate-fade-in">
                    <div className={`w-24 h-24 ${isCrashed ? 'bg-red-500/20' : 'bg-g1000-green/20'} rounded-full flex items-center justify-center mb-4`}>
                        {isCrashed ? <AlertCircle className="w-16 h-16 text-red-500" /> : <Award className="w-16 h-16 text-g1000-green" />}
                    </div>
                    <h2 className={`text-4xl font-black tracking-widest uppercase ${isCrashed ? 'text-red-500' : 'text-white'}`}>
                        {isCrashed ? "CRASH DETECTED" : (isHomingMission || isLandingMission ? "Safe Landing" : "Simulation Complete")}
                    </h2>
                    <div className="mt-4 space-y-4 text-zinc-400">
                        <p className="text-lg leading-relaxed max-w-lg">
                          {isCrashed 
                            ? "Impact with terrain recorded. Vertical speed or bank angle exceeded safety limits during touchdown."
                            : (isHomingMission 
                                ? "Superior pilot skills! You navigated an engine failure and safely reached the runway threshold." 
                                : isLandingMission
                                ? "Touchdown confirmed on centerline. Crosswind correction technique was effective."
                                : "Excellent work! You have successfully tracked the station inbound and outbound."
                              )
                          }
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 text-center"><span className="block text-[10px] text-zinc-600 uppercase tracking-widest font-black mb-1">Performance</span><span className={`text-3xl font-black uppercase tracking-tighter ${isCrashed ? 'text-red-500' : 'text-g1000-cyan'}`}>{isCrashed ? 'FAILED' : 'Qualified'}</span></div>
                            <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 text-center"><span className="block text-[10px] text-zinc-600 uppercase tracking-widest font-black mb-1">Landing Dist</span><span className="text-3xl font-black text-g1000-green">{currentDme} NM</span></div>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full mt-10">
                        {!isLandingMission && !isCrashed && (
                            <button onClick={() => setShowReviewMap(true)} className="flex-1 bg-zinc-800 text-white py-4 rounded-2xl font-black tracking-[0.3em] uppercase hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                                <Map className="w-5 h-5" /> Review Flight Track
                            </button>
                        )}
                        <button onClick={onExit} className={`flex-1 ${isCrashed ? 'bg-red-600' : 'bg-g1000-green'} text-black py-4 rounded-2xl font-black tracking-[0.3em] uppercase hover:brightness-110 active:scale-95 transition-all shadow-xl`}>
                            {isCrashed ? "REPORT INCIDENT" : "Return to Syllabus"}
                        </button>
                    </div>
                  </div>
                )}
            </div>
        </div>
      )}

      {/* EMERGENCY ALERT OVERLAY */}
      {emergencyAlert && !isCompleted && !isPaused && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce w-full max-w-xl">
              <div className="bg-red-600 text-white px-8 py-4 rounded-2xl border-2 border-white shadow-[0_0_60px_rgba(255,0,0,0.8)] flex items-center justify-between gap-6 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <Zap className="w-8 h-8 animate-pulse" />
                    <div>
                        <h5 className="font-black tracking-widest uppercase text-base">Engine Failure Detected</h5>
                        <p className="text-[10px] font-bold uppercase opacity-80">Navigate directly to airport (VOR Station)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                      <button 
                        onClick={centerCDI}
                        className="bg-white text-red-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95 shadow-xl"
                      >
                        Center CDI
                      </button>
                      <button 
                        onClick={() => { playSound('click'); setShowCdiExplanation(true); }}
                        className="bg-red-800 text-white p-2.5 rounded-xl border border-white/20 hover:bg-red-700 transition-colors"
                        title="Theory: Why center the CDI?"
                      >
                        <BookOpen className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* INITIAL BRIEFING POPUP */}
      {isPaused && !showPassageExplanation && !isCompleted && !showPTSelection && !courseChangeAlert && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-transparent pointer-events-auto">
           <div className="bg-black border-2 border-white p-6 shadow-[0_0_80px_rgba(0,0,0,1)] w-[320px] animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                 <div className="p-1 bg-white text-black rounded-sm flex items-center justify-center overflow-hidden"><img src={AIRCRAFT_IMG_URL} className="w-5 h-5 object-contain" alt="HSI Icon" /></div>
                 <span className="text-[12px] font-black tracking-[0.3em] uppercase">{isHomingMission ? "Emergency Brief" : isLandingMission ? "Approach Brief" : "Initial Briefing"}</span>
              </div>
              <div className="space-y-4 mb-6">
                 {isHomingMission ? (
                     <>
                        <p className="text-[13px] font-bold text-white leading-tight uppercase">MISSION: <span className="text-g1000-cyan">STATION HOMING</span>.</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight border-b border-white/5 pb-2">PREPARE FOR ENGINE FAILURE. IDENTIFY RADIAL & HOME DIRECT TO STATION.</p>
                     </>
                 ) : isInboundInterceptMission ? (
                     <>
                        <p className="text-[13px] font-bold text-white leading-tight uppercase">MISSION: <span className="text-g1000-cyan">PROCEDURE TURN</span>.</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight border-b border-white/5 pb-2">1. FLY OUTBOUND 090.<br/>2. AT 5 DME EXECUTE PROC TURN.<br/>3. INTERCEPT INBOUND R-270.</p>
                     </>
                 ) : isLandingMission ? (
                     <>
                        <p className="text-[13px] font-bold text-white leading-tight uppercase">LANDING: <span className="text-g1000-cyan">CROSSWIND</span>.</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight border-b border-white/5 pb-2">
                            Wind 270@15G20. Use Rudder to crab and Aileron to sideslip. Maintain centerline.
                        </p>
                     </>
                 ) : isOutboundMission ? (
                     <>
                        <p className="text-[13px] font-bold text-white leading-tight uppercase">MISSION: <span className="text-g1000-cyan">COURSE CHANGE</span>.</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight border-b border-white/5 pb-2">1. TRACK RADIAL 170 OUTBOUND.<br/>2. AT 5 DME INTERCEPT R-160.<br/>3. TRACK TO FIX WM01.</p>
                     </>
                 ) : (
                     <>
                        <p className="text-[13px] font-bold text-white leading-tight uppercase">INTERCEPT <span className="text-g1000-cyan">RADIAL 180</span>.</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-tight border-b border-white/5 pb-2">CENTER CDI NEEDLE. CORRECT FOR CROSSWIND.</p>
                     </>
                 )}
                 {!isLandingMission && <p className="text-[11px] text-g1000-amber uppercase font-black tracking-widest leading-tight pt-2 flex items-center gap-2"><Info className="w-4 h-4" /> FIND YOUR BEARING</p>}
              </div>
              <button onClick={() => setIsPaused(false)} className="w-full bg-white text-black py-3 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2">CONTINUE</button>
           </div>
        </div>
      )}

      {/* STATION PASSAGE TUTORIAL */}
      {showPassageExplanation && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
            <div className="max-w-4xl w-full bg-[#111] border-2 border-g1000-cyan/50 p-10 rounded-3xl shadow-[0_0_100px_rgba(0,255,255,0.2)] flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/2 flex flex-col items-center gap-6">
                    <div className="relative w-56 h-56 bg-black rounded-full border-4 border-zinc-800 flex items-center justify-center overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-[10px] absolute top-4 text-zinc-500 font-black uppercase tracking-widest">VOR Kollsman's Window</div>
                            <div className="relative h-14 w-28 bg-zinc-900 rounded-lg border-2 border-white/10 overflow-hidden shadow-inner flex flex-col">
                                <div className="w-full flex flex-col animate-[passage-flag-sequence_6s_infinite]">
                                    <div className="h-[52px] w-full flex items-center justify-center shrink-0"><span className="text-g1000-green font-black text-xl">TO</span></div>
                                    <div className="h-[52px] w-full bg-[repeating-linear-gradient(45deg,#ff0000,#ff0000_4px,#ffffff_4px,#ffffff_8px)] opacity-90 flex items-center justify-center shrink-0"><span className="text-[10px] bg-black/80 px-2 py-0.5 rounded font-black text-white">OFF / NAV</span></div>
                                    <div className="h-[52px] w-full flex items-center justify-center shrink-0"><span className="text-white font-black text-xl uppercase">FR</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute h-36 w-1 bg-g1000-cyan animate-[passage-cdi_3s_infinite_alternate] shadow-[0_0_15px_cyan] pointer-events-none z-20"></div>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-2"><Plane className="w-5 h-5 text-g1000-cyan animate-bounce" /><span className="text-[12px] font-black text-white uppercase tracking-widest">Entering Cone of Confusion</span></div>
                        <p className="text-[11px] text-zinc-500 max-w-[300px] leading-relaxed italic">Directly above the station, signals disappear. The instrument flag window transitions through OFF before flipping.</p>
                    </div>
                </div>
                <div className="w-full md:w-1/2 space-y-6">
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6"><div className="p-3 bg-g1000-cyan/20 rounded-xl shadow-lg"><Info className="w-8 h-8 text-g1000-cyan" /></div><div><h3 className="text-2xl font-black text-white tracking-widest uppercase">Station Passage</h3><p className="text-[11px] text-g1000-cyan font-bold tracking-[0.2em] uppercase">Transition: Inbound &rarr; Outbound</p></div></div>
                    <div className="space-y-4">
                        <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-g1000-cyan/30 transition-colors">
                            <h4 className="text-[12px] font-black text-g1000-green uppercase mb-1 tracking-widest">1. THE INDICATOR FLIP</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">As you cross the VOR, the flag transitions from <span className="text-g1000-green font-bold">TO</span>, briefly through <span className="text-red-500 font-bold">OFF</span>, and settles on <span className="text-white font-bold uppercase">FR</span>.</p>
                        </div>
                        <div className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-g1000-cyan/30 transition-colors">
                            <h4 className="text-[12px] font-black text-g1000-cyan uppercase mb-1 tracking-widest">2. MISSION COMPLETION</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">After passage, track <span className="font-bold text-white">Radial 360</span>. The simulator will end once you reach the 12 NM waypoint marker.</p>
                        </div>
                    </div>
                    <button onClick={closeExplanation} className="w-full bg-g1000-cyan text-black py-4 rounded-xl font-black tracking-[0.5em] uppercase hover:brightness-110 transition-all active:scale-95 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">RESUME OUTBOUND</button>
                </div>
            </div>
            <style>{`
                @keyframes passage-flag-sequence {
                    0%, 30% { transform: translateY(0); }
                    35%, 65% { transform: translateY(-52px); }
                    70%, 100% { transform: translateY(-104px); }
                }
                @keyframes passage-cdi {
                    0% { transform: translateX(-40px); }
                    40% { transform: translateX(40px); }
                    50% { transform: translateX(0); opacity: 0.3; }
                    60% { transform: translateX(-50px); opacity: 1; }
                    100% { transform: translateX(50px); }
                }
            `}</style>
        </div>
      )}

      {/* LEFT COCKPIT SIDEBAR */}
      <div className="absolute top-8 left-8 z-50 flex flex-col gap-3.5 max-h-[95%] overflow-y-auto no-scrollbar pb-8">
         <button onClick={onExit} className="bg-zinc-900/95 backdrop-blur-md border border-white/10 px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-all text-[11px] font-black tracking-[0.25em] uppercase shadow-2xl group w-fit">
            <ChevronLeft className="w-4 h-4 text-g1000-cyan group-hover:-translate-x-1 transition-transform" />Abort Mission
         </button>
         
         {!isLandingMission && (
             <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 p-3.5 px-5 rounded-2xl flex flex-col items-center gap-2 shadow-2xl w-96">
                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Power Control</span>
                <div className="flex items-center gap-12">
                  <button onMouseDown={() => { handleThrottle('up'); }} className="p-2.5 bg-zinc-800 hover:bg-g1000-green/20 hover:text-g1000-green border border-white/5 rounded-xl transition-all active:scale-90 shadow-lg"><ArrowUp className="w-5 h-5" /></button>
                  <div className="h-12 w-4 bg-black rounded-full relative overflow-hidden shadow-inner"><div className="absolute bottom-0 w-full bg-g1000-green transition-all" style={{ height: `${(velocity / 5) * 100}%` }}></div></div>
                  <button onMouseDown={() => { handleThrottle('down'); }} className="p-2.5 bg-zinc-800 hover:bg-red-500/20 hover:text-red-500 border border-white/5 rounded-xl transition-all active:scale-90 shadow-lg"><ArrowDown className="w-5 h-5" /></button>
                </div>
             </div>
         )}

         {renderInstrument()}
      </div>

      {/* DEFLECTION CAUTION */}
      {Math.abs(cdiDeflection) > 0.05 && !isPaused && !isCompleted && !isHomingMission && !isLandingMission && phase !== 'PROC_TURN' && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[60] animate-fade-in pointer-events-none">
           <div className="bg-black/90 border-2 border-red-600 p-5 shadow-[0_0_50px_rgba(255,0,0,0.5)] flex flex-col items-center gap-3 min-w-[320px] backdrop-blur-md rounded-2xl">
              <div className="flex items-center gap-3 text-red-500 font-black tracking-[0.25em] uppercase text-[10px]"><AlertCircle className="w-5 h-5 animate-pulse" /> NAVIGATION ALERT: WIND DRIFT</div>
              <div className="text-white text-[12px] font-black uppercase tracking-[0.1em] text-center leading-tight whitespace-pre-wrap">{cdiDeflection > 0 ? "NEEDLE DEFLECTED RIGHT\nSTEER RIGHT TO INTERCEPT" : "NEEDLE DEFLECTED LEFT\nSTEER LEFT TO INTERCEPT"}</div>
           </div>
        </div>
      )}

      {passageAlert && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce"><div className="bg-g1000-cyan text-black px-10 py-5 rounded-2xl font-black tracking-[0.25em] uppercase shadow-[0_0_60px_cyan]">Station Passage Detected</div></div>)}
      {interceptAlert && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce"><div className="bg-g1000-cyan text-black px-10 py-5 rounded-2xl font-black tracking-[0.25em] uppercase shadow-[0_0_60px_cyan]">RADIAL 145 CAPTURED</div></div>)}
      {ptAlert && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce"><div className="bg-g1000-magenta text-black px-10 py-5 rounded-2xl font-black tracking-[0.25em] uppercase shadow-[0_0_60px_magenta]">5 DME REACHED - EXECUTE PROC TURN</div></div>)}
      {inboundEstablishedAlert && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce"><div className="bg-g1000-green text-black px-10 py-5 rounded-2xl font-black tracking-[0.25em] uppercase shadow-[0_0_60px_#00FF00]">ESTABLISHED INBOUND</div></div>)}

      {/* RIGHT SIDEBAR - TOP RIGHT */}
      <div className="absolute top-8 right-8 z-50 flex flex-col items-end gap-6">
        <div className="bg-zinc-950/90 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-[300px] animate-fade-in relative overflow-hidden backdrop-blur-md">
           <div className="absolute top-0 right-0 w-32 h-32 bg-g1000-cyan/5 blur-[80px] rounded-full"></div>
           <div className="flex items-center gap-3 mb-6 relative"><div className="p-3 bg-g1000-cyan/10 rounded-xl"><Target className="w-5 h-5 text-g1000-cyan animate-pulse" /></div><span className="text-sm font-black tracking-[0.25em] uppercase text-white">Flight Plan Objective</span></div>
           <div className="space-y-4">
              {isHomingMission ? (
                  <>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${!emergencyAlert ? 'text-g1000-cyan' : 'text-zinc-500 line-through'}`}>1. Identify Location</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${emergencyAlert ? 'bg-g1000-green' : 'bg-zinc-800'}`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${emergencyAlert ? 'text-red-500' : 'text-zinc-500'}`}>2. Home to Station</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-g1000-green' : (emergencyAlert ? 'bg-red-500 animate-pulse' : 'bg-zinc-800')}`}></div>
                    </div>
                  </>
              ) : isInboundInterceptMission ? (
                  <>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'OUTBOUND' ? 'text-g1000-cyan' : 'text-zinc-500 line-through'}`}>1. Outbound 090 to 5 DME</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${phase !== 'OUTBOUND' ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800'}`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'PROC_TURN' ? 'text-g1000-cyan' : (phase === 'OUTBOUND' ? 'text-zinc-500' : 'text-zinc-500 line-through')}`}>2. Procedure Turn</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${phase === 'INBOUND_TRACK' || isCompleted ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800'}`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'INBOUND_TRACK' ? 'text-g1000-cyan' : 'text-zinc-500'}`}>3. Inbound R-270</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800 shadow-inner'}`}></div>
                    </div>
                  </>
              ) : isLandingMission ? (
                  <>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${!isCompleted ? 'text-g1000-cyan' : 'text-zinc-500'}`}>1. Crab into Wind</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${landingYaw < -5 ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800'}`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${!isCompleted ? 'text-g1000-cyan' : 'text-zinc-500'}`}>2. Maintain Centerline</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${Math.abs(landingOffset) < 100 ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800'}`}></div>
                    </div>
                  </>
              ) : isOutboundMission ? (
                  <>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'OUTBOUND' ? 'text-g1000-cyan' : 'text-zinc-500 line-through'}`}>1. R-170 to 5 DME</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${phase !== 'OUTBOUND' ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800'}`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'INTERCEPT' ? 'text-g1000-cyan' : (phase === 'OUTBOUND' ? 'text-zinc-500' : 'text-zinc-500 line-through')}`}>2. Intercept R-160</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${phase === 'TRACKING' || isCompleted ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800'}`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'TRACKING' ? 'text-g1000-cyan' : 'text-zinc-500'}`}>3. Track to WM01</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800 shadow-inner'}`}></div>
                    </div>
                  </>
              ) : (
                  <>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'INBOUND' ? 'text-g1000-cyan' : 'text-zinc-500 line-through'}`}>1. Inbound Radial 180</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${phase === 'OUTBOUND' ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800'}`}></div>
                    </div>
                    <div className="flex items-center justify-end gap-4">
                       <span className={`text-[11px] font-black uppercase tracking-widest ${phase === 'OUTBOUND' ? 'text-g1000-cyan' : 'text-zinc-500'}`}>2. Outbound Radial 360</span>
                       <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-g1000-green shadow-[0_0_12px_#00FF00]' : 'bg-zinc-800 shadow-inner'}`}></div>
                    </div>
                  </>
              )}
           </div>
           <p className="text-[12px] text-zinc-400 leading-relaxed font-bold relative text-right mt-6 pt-6 border-t border-white/10">PHASE: <span className={`${isHomingMission && emergencyAlert ? 'text-red-500' : 'text-g1000-amber'} uppercase`}>{phase}</span><br/>DME: <span className="text-white">{currentDme} NM</span></p>
        </div>

        {/* FLIGHT TELEMETRY LINK - MOVED BELOW OBJECTIVES */}
        <div className="bg-black/85 backdrop-blur-md border border-white/10 p-5 rounded-2xl text-[11px] space-y-2.5 w-full max-w-[300px] shadow-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-1"><span className="text-zinc-500 font-black tracking-widest uppercase text-[8px]">Flight Telemetry Link</span><div className="w-2 h-2 rounded-full bg-g1000-green shadow-[0_0_12px_#00FF00] animate-pulse"></div></div>
            <div className="space-y-2">
                <div className="flex justify-between items-center"><span className="text-zinc-400 font-bold uppercase tracking-tighter">Magnetic Heading</span><span className="text-g1000-cyan font-black text-sm">{Math.round(heading).toString().padStart(3, '0')}°</span></div>
                <div className="flex justify-between items-center"><span className="text-zinc-400 font-bold uppercase tracking-tighter">Indicated Airspeed</span><span className="text-g1000-green font-black text-sm">{(velocity * 100).toFixed(0)} KTS</span></div>
                <div className="flex justify-between items-center"><span className="text-zinc-400 font-bold uppercase tracking-tighter">DME Station Dist</span><span className="text-g1000-green font-black text-sm">{currentDme} NM</span></div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10"><span className="text-zinc-400 font-bold uppercase tracking-tighter">Current Radial</span><span className="text-g1000-amber font-black text-sm">{radial.toString().padStart(3, '0')}°</span></div>
                {isHomingMission && (
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-zinc-400 font-bold uppercase tracking-tighter flex items-center gap-2"><Activity className="w-3 h-3" /> Engine Health</span>
                        <span className={`font-black text-sm ${engineHealth < 50 ? 'text-red-500 animate-pulse' : 'text-g1000-green'}`}>{engineHealth.toFixed(0)}%</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* DIRECTIONAL CONTROLS - BOTTOM RIGHT */}
      {!isLandingMission && (
        <div className="absolute bottom-8 right-8 z-[70] flex gap-4">
            <button onMouseDown={() => { handleSteer('left'); }} className="w-16 h-16 bg-zinc-900/95 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-g1000-cyan/20 hover:border-g1000-cyan transition-all active:scale-90 shadow-2xl group backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <ArrowLeft className="w-8 h-8 text-zinc-500 group-hover:text-g1000-cyan" />
            </button>
            <button onMouseDown={() => { handleSteer('right'); }} className="w-16 h-16 bg-zinc-900/95 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-g1000-cyan/20 hover:border-g1000-cyan transition-all active:scale-90 shadow-2xl group backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <ArrowRight className="w-8 h-8 text-zinc-500 group-hover:text-g1000-cyan" />
            </button>
        </div>
      )}

      {/* LANDING D-PAD CONTROLS */}
      {isLandingMission && !isCompleted && !isCrashed && (
          <div className="absolute bottom-12 right-12 z-[80] grid grid-cols-3 gap-2 p-4 bg-zinc-900/80 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl scale-125 origin-bottom-right">
              <div></div>
              <button 
                onMouseDown={() => setLandingPitch(p => Math.min(10, p + 1))} // Down Button -> Pitch Up
                className="w-12 h-12 bg-black border border-white/20 rounded-xl flex items-center justify-center hover:border-g1000-cyan hover:text-g1000-cyan active:scale-95 active:bg-g1000-cyan/20 transition-all shadow-lg"
              >
                  <ArrowDown className="w-6 h-6" />
              </button>
              <div></div>
              
              <button 
                onMouseDown={() => setLandingYaw(y => y + 2)} 
                className="w-12 h-12 bg-black border border-white/20 rounded-xl flex items-center justify-center hover:border-g1000-cyan hover:text-g1000-cyan active:scale-95 active:bg-g1000-cyan/20 transition-all shadow-lg"
              >
                  <ArrowLeft className="w-6 h-6" />
              </button>
              
              <button 
                onMouseDown={() => setLandingPitch(p => Math.max(-10, p - 1))} // Up Button -> Pitch Down
                className="w-12 h-12 bg-black border border-white/20 rounded-xl flex items-center justify-center hover:border-g1000-cyan hover:text-g1000-cyan active:scale-95 active:bg-g1000-cyan/20 transition-all shadow-lg"
              >
                  <ArrowUp className="w-6 h-6" />
              </button>

              <button 
                onMouseDown={() => setLandingYaw(y => y - 2)} 
                className="w-12 h-12 bg-black border border-white/20 rounded-xl flex items-center justify-center hover:border-g1000-cyan hover:text-g1000-cyan active:scale-95 active:bg-g1000-cyan/20 transition-all shadow-lg"
              >
                  <ArrowRight className="w-6 h-6" />
              </button>
          </div>
      )}

      <div className="flex-1 relative">
         <canvas ref={canvasRef} width={800} height={600} className="w-full h-full cursor-crosshair" />
         <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]"></div>
      </div>
    </div>
  );
};

export default VORSimulator;
