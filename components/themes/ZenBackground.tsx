import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    p5: any;
  }
}

type P5Graphics = any;

// Helper easing function with better smoothing
const ease = (t: number, power = 2) => {
  // Improved easing function with better acceleration and deceleration
  return t < 0.5
    ? Math.pow(2 * t, power) / 2
    : 1 - Math.pow(2 * (1 - t), power) / 2;
};

// Add smooth interpolation helper
const smoothstep = (min: number, max: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

// Enhanced easing functions for smoother animations
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Improved particle pool for better performance
class ParticlePool {
  private pool: Particle[];
  private maxSize: number;

  constructor(maxSize: number) {
    this.pool = [];
    this.maxSize = maxSize;
  }

  get(): Particle | null {
    return this.pool.pop() || null;
  }

  release(particle: Particle): void {
    if (this.pool.length < this.maxSize) {
      particle.transitionProgress = 0;
      particle.scale = 1;
      particle.opacity = 1;
      this.pool.push(particle);
    }
  }
}

interface ZenBackgroundProps {
  mode: "intro" | "story";
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  char: string;
  meaning: string;
  rotation: number;
  rotationSpeed: number;
  showMeaning: boolean;
  meaningTimer: number;
  swayOffset: number;
  meaningText: string;
  meaningProgress: number;
  targetX?: number;
  targetY?: number;
  originalX?: number;
  originalY?: number;
  transitionProgress: number;
  corner?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  scale: number;
  opacity: number;
}

interface GrassParticle {
  x: number;
  y: number;
  height: number;
  swayOffset: number;
  side: "top" | "bottom" | "left" | "right";
  thickness: number;
}

interface SmokeParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const getRandomCorner = (p: any, lastCorner: string | null) => {
  const corners: Array<"topLeft" | "topRight" | "bottomLeft" | "bottomRight"> =
    ["topLeft", "topRight", "bottomLeft", "bottomRight"];

  const availableCorners = corners.filter((corner) => corner !== lastCorner);
  const corner =
    availableCorners[Math.floor(p.random(availableCorners.length))];

  const padding = 150;
  let x, y;

  switch (corner) {
    case "topLeft":
      x = padding;
      y = padding;
      break;
    case "topRight":
      x = p.width - padding;
      y = padding;
      break;
    case "bottomLeft":
      x = padding;
      y = p.height - padding;
      break;
    case "bottomRight":
      x = p.width - padding;
      y = p.height - padding;
      break;
  }

  return { x, y, corner };
};

const getDeltaTime = (p: any, lastFrameTime: number) => {
  const currentTime = p.millis();
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  return Math.min(deltaTime, 0.1); // Cap delta time to prevent large jumps
};

const ZenBackground: React.FC<ZenBackgroundProps> = ({ mode = "story" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<any>(null);
  const particlePoolRef = useRef<ParticlePool>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    particlePoolRef.current = new ParticlePool(50);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js";
    script.async = true;
    script.onload = () => {
      const sketch = (p: any) => {
        let layer: any;
        const kanji = [
          { char: "愛", meaning: "Love" },
          { char: "家", meaning: "Family/Home" },
          { char: "絆", meaning: "Bonds/Connections" },
          { char: "情", meaning: "Feelings/Emotion" },
          { char: "恩", meaning: "Kindness/Grace" },
          { char: "縁", meaning: "Destiny/Connection" },
          { char: "幸", meaning: "Happiness" },
          { char: "祈", meaning: "Prayer/Wish" },
          { char: "夢", meaning: "Dreams" },
          { char: "心", meaning: "Heart" },
          { char: "親", meaning: "Parent/Intimacy" },
          { char: "恋", meaning: "Love/Affection" },
        ];

        let particles: Particle[] = [];
        let grassParticles: GrassParticle[] = [];
        let revealingKanji: Particle | null = null;
        let lastRevealTime = 0;
        let lastCorner: string | null = null;
        let lastFrameTime = 0;
        let smokeParticles: SmokeParticle[] = [];

        // Add a tracker for used kanji
        let usedKanjiIndices: number[] = [];

        const getNextRandomKanji = () => {
          // Reset if all kanji have been used
          if (usedKanjiIndices.length === kanji.length) {
            usedKanjiIndices = [];
          }

          // Get available indices
          const availableIndices = kanji
            .map((_, index) => index)
            .filter((index) => !usedKanjiIndices.includes(index));

          // Select random index from available ones
          const randomIndex =
            availableIndices[Math.floor(p.random(availableIndices.length))];
          usedKanjiIndices.push(randomIndex);

          return kanji[randomIndex];
        };

        const initializeGrass = () => {
          grassParticles = [];
          // Increased density and varied heights
          const spacing = 2; // Decreased spacing for more density

          // Bottom grass
          for (let x = 0; x < p.width; x += spacing) {
            grassParticles.push({
              x,
              y: p.height,
              height: p.random(30, 60), // Increased height variation
              swayOffset: p.random(p.TWO_PI),
              side: "bottom",
              thickness: p.random(0.5, 2), // Added thickness variation
            });
          }

          // Top grass
          for (let x = 0; x < p.width; x += spacing) {
            grassParticles.push({
              x,
              y: 0,
              height: p.random(30, 60),
              swayOffset: p.random(p.TWO_PI),
              side: "top",
              thickness: p.random(0.5, 2),
            });
          }

          // Side grass
          for (let y = 0; y < p.height; y += spacing) {
            // Left side
            grassParticles.push({
              x: 0,
              y,
              height: p.random(30, 60),
              swayOffset: p.random(p.TWO_PI),
              side: "left",
              thickness: p.random(0.5, 2),
            });
            // Right side
            grassParticles.push({
              x: p.width,
              y,
              height: p.random(30, 60),
              swayOffset: p.random(p.TWO_PI),
              side: "right",
              thickness: p.random(0.5, 2),
            });
          }
        };

        const createSmokeParticle = (
          p: any,
          x: number,
          y: number,
          intensity: number = 1
        ) => {
          const angle = p.random(p.TWO_PI);
          const speed = p.random(0.5, 2) * intensity;
          return {
            x,
            y,
            size: p.random(20, 50) * intensity,
            alpha: p.random(40, 80),
            vx: p.cos(angle) * speed,
            vy: p.sin(angle) * speed,
            life: 0,
            maxLife: p.random(60, 120),
          };
        };

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
          canvas.parent(containerRef.current!);
          layer = p.createGraphics(p.width, p.height);
          layer.textAlign(p.CENTER, p.CENTER);
          layer.textFont("serif");
          initializeGrass();

          // Initialize kanji particles with improved properties
          for (let i = 0; i < 20; i++) {
            const kanjiChar = getNextRandomKanji();
            particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              size: p.random(30, 80),
              speed: p.random(0.2, 0.6),
              char: kanjiChar.char,
              meaning: kanjiChar.meaning,
              rotation: p.random(p.TWO_PI),
              rotationSpeed: p.random(-0.02, 0.02),
              showMeaning: false,
              meaningTimer: 0,
              swayOffset: p.random(p.TWO_PI),
              meaningText: "",
              meaningProgress: 0,
              transitionProgress: 0,
              scale: 1,
              opacity: 1,
            });
          }
        };

        const drawGrass = () => {
          layer.strokeWeight(1.5); // Increased base stroke weight

          grassParticles.forEach((grass) => {
            const time = p.frameCount * 0.015; // Slowed down animation
            const windEffect = p.sin(time + grass.swayOffset) * 8; // Increased sway amount
            const windX =
              windEffect *
              (grass.side === "left" || grass.side === "right" ? 0.5 : 1);
            const windY =
              windEffect *
              (grass.side === "top" || grass.side === "bottom" ? 0.5 : 1);

            // Dynamic color and opacity
            const alpha = p.map(p.sin(time + grass.swayOffset), -1, 1, 70, 120);
            layer.stroke(34, 197, 94, alpha);
            layer.strokeWeight(grass.thickness);

            switch (grass.side) {
              case "bottom":
                layer.line(
                  grass.x,
                  grass.y,
                  grass.x + windX,
                  grass.y - grass.height
                );
                break;
              case "top":
                layer.line(
                  grass.x,
                  grass.y,
                  grass.x + windX,
                  grass.y + grass.height
                );
                break;
              case "left":
                layer.line(
                  grass.x,
                  grass.y,
                  grass.x + grass.height,
                  grass.y + windY
                );
                break;
              case "right":
                layer.line(
                  grass.x,
                  grass.y,
                  grass.x - grass.height,
                  grass.y + windY
                );
                break;
            }
          });
        };

        const revealKanji = () => {
          if (revealingKanji) return;

          const now = p.millis();
          if (now - lastRevealTime < 12000) return;

          const particle =
            particlePoolRef.current?.get() ||
            particles[Math.floor(p.random(particles.length))];
          if (!particle) return;

          const { x, y, corner } = getRandomCorner(p, lastCorner);
          const nextKanji = getNextRandomKanji();

          // Add smoke particles for the entrance effect
          for (let i = 0; i < 15; i++) {
            smokeParticles.push(createSmokeParticle(p, x, y, 1.5));
          }

          revealingKanji = {
            ...particle,
            char: nextKanji.char,
            meaning: nextKanji.meaning,
            originalX: particle.x,
            originalY: particle.y,
            targetX: x,
            targetY: y,
            corner,
            transitionProgress: 0,
            meaningText: "",
            meaningProgress: 0,
            scale: 0.8,
            opacity: 0,
          };

          lastRevealTime = now;
          particles = particles.filter((p) => p !== particle);
        };

        const drawSmoke = () => {
          layer.noStroke();
          smokeParticles.forEach((particle, index) => {
            particle.life++;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha *= 0.97;

            const lifeProgress = particle.life / particle.maxLife;
            const fadeOut = 1 - easeOutExpo(lifeProgress);

            layer.fill(34, 197, 94, particle.alpha * fadeOut);
            layer.circle(
              particle.x,
              particle.y,
              particle.size * (1 + lifeProgress * 0.5)
            );

            if (particle.life >= particle.maxLife) {
              smokeParticles.splice(index, 1);
            }
          });
        };

        p.draw = () => {
          const deltaTime = getDeltaTime(p, lastFrameTime);
          lastFrameTime = p.millis();
          p.clear();
          layer.clear();

          drawGrass();
          drawSmoke();

          // Handle revealing kanji with enhanced transitions
          if (revealingKanji) {
            revealingKanji.transitionProgress = Math.min(
              1,
              revealingKanji.transitionProgress + deltaTime * 0.6
            );

            const easeProgress = easeOutExpo(revealingKanji.transitionProgress);

            const x = p.lerp(
              revealingKanji.originalX!,
              revealingKanji.targetX!,
              easeProgress
            );
            const y = p.lerp(
              revealingKanji.originalY!,
              revealingKanji.targetY!,
              easeProgress
            );

            // Enhanced scale and opacity transitions
            revealingKanji.scale = p.lerp(
              0.8,
              1.2,
              easeInOutCubic(easeProgress)
            );
            revealingKanji.opacity = p.lerp(0, 1, easeOutExpo(easeProgress));

            layer.push();
            layer.translate(x, y);
            layer.scale(revealingKanji.scale);

            // Improved kanji rendering
            const alpha = 220 * revealingKanji.opacity;
            layer.fill(34, 197, 94, alpha * 0.3);
            layer.textSize(100); // Increased size
            layer.text(revealingKanji.char, 2, 2);
            layer.fill(34, 197, 94, alpha);
            layer.text(revealingKanji.char, 0, 0);

            // Enhanced meaning reveal with typewriter effect
            if (easeProgress > 0.7) {
              // Slowed down meaning progress speed from 2.5 to 1.25
              revealingKanji.meaningProgress = Math.min(
                1,
                revealingKanji.meaningProgress + deltaTime * 1.25
              );

              const meaningProgress = easeOutExpo(
                revealingKanji.meaningProgress
              );

              // Add typewriter cursor effect
              const meaningLength = Math.floor(
                revealingKanji.meaning.length * meaningProgress
              );
              const cursor = Math.sin(p.frameCount * 0.2) > 0 ? "_" : "";
              revealingKanji.meaningText =
                revealingKanji.meaning.slice(0, meaningLength) +
                (meaningLength < revealingKanji.meaning.length ? cursor : "");

              layer.textSize(40);
              const meaningAlpha = 220 * easeOutExpo(meaningProgress);
              layer.fill(34, 197, 94, meaningAlpha);

              const meaningOffset = 100;
              const offsetX = revealingKanji.corner?.includes("Right")
                ? -meaningOffset
                : meaningOffset;
              const offsetY = revealingKanji.corner?.includes("Bottom")
                ? -meaningOffset
                : meaningOffset;

              layer.text(revealingKanji.meaningText, offsetX, offsetY);
            }

            layer.pop();

            // Smooth transition out
            if (
              revealingKanji.transitionProgress >= 1 &&
              revealingKanji.meaningProgress >= 1
            ) {
              setTimeout(() => {
                if (revealingKanji) {
                  // Add more smoke particles for a longer fade
                  for (let i = 0; i < 25; i++) {
                    smokeParticles.push(
                      createSmokeParticle(
                        p,
                        revealingKanji.targetX!,
                        revealingKanji.targetY!,
                        1.0
                      )
                    );
                  }

                  const newParticle = {
                    ...revealingKanji,
                    x: p.random(p.width),
                    y: p.height + 50,
                    showMeaning: false,
                    meaningTimer: 0,
                    meaningText: "",
                    meaningProgress: 0,
                    scale: 1,
                    opacity: 1,
                  };
                  particles.push(newParticle);
                  particlePoolRef.current?.release(revealingKanji);
                  revealingKanji = null;
                }
              }, 5000);
            }
          }

          // Update floating kanji
          particles.forEach((particle) => {
            particle.y -= particle.speed * deltaTime * 60;
            particle.rotation += particle.rotationSpeed * deltaTime * 60;

            if (particle.y < -50) {
              particle.y = p.height + 50;
              particle.x = p.random(p.width);
            }

            const baseAlpha = mode === "intro" ? 220 : 180;
            const distanceFromCenter =
              p.abs(particle.x - p.width / 2) / p.width;
            const fadeEffect = easeOutExpo(1 - distanceFromCenter * 1.5);

            const sway = p.sin(p.frameCount * 0.02 + particle.swayOffset) * 4;
            const finalX = particle.x + sway;

            layer.push();
            layer.translate(finalX, particle.y);
            layer.rotate(particle.rotation);

            const alpha = baseAlpha * fadeEffect;
            layer.fill(34, 197, 94, alpha * 0.3);
            layer.textSize(particle.size);
            layer.text(particle.char, 2, 2);

            layer.fill(34, 197, 94, alpha);
            layer.text(particle.char, 0, 0);

            layer.pop();
          });

          // Regular reveal check
          if (p.frameCount % 240 === 0) {
            // Every 4 seconds
            revealKanji();
          }

          p.image(layer, -p.width / 2, -p.height / 2);
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          layer.resizeCanvas(p.width, p.height);
          initializeGrass();
        };
      };

      p5Instance.current = new window.p5(sketch);
    };

    document.body.appendChild(script);

    return () => {
      p5Instance.current?.remove();
      document.body.removeChild(script);
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};

export default ZenBackground;
