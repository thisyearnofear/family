import React, { useEffect, useRef } from "react";
import p5 from "p5";

// Helper easing function
const ease = (t: number, power = 2) => {
  if (t < 0.5) {
    return Math.pow(2 * t, power) / 2;
  } else {
    return 1 - Math.pow(2 * (1 - t), power) / 2;
  }
};

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
  transitionProgress?: number;
  corner?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}

interface GrassParticle {
  x: number;
  y: number;
  height: number;
  swayOffset: number;
  side: "top" | "bottom" | "left" | "right";
}

const ZenBackground: React.FC<ZenBackgroundProps> = ({ mode = "story" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5>();

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let layer: p5.Graphics;
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

      const initializeGrass = () => {
        grassParticles = [];
        // Bottom grass - denser
        for (let x = 0; x < p.width; x += 3) {
          grassParticles.push({
            x,
            y: p.height,
            height: p.random(20, 40),
            swayOffset: p.random(p.TWO_PI),
            side: "bottom",
          });
        }
        // Top grass - denser
        for (let x = 0; x < p.width; x += 3) {
          grassParticles.push({
            x,
            y: 0,
            height: p.random(20, 40),
            swayOffset: p.random(p.TWO_PI),
            side: "top",
          });
        }
        // Left grass - denser
        for (let y = 0; y < p.height; y += 3) {
          grassParticles.push({
            x: 0,
            y,
            height: p.random(20, 40),
            swayOffset: p.random(p.TWO_PI),
            side: "left",
          });
        }
        // Right grass - denser
        for (let y = 0; y < p.height; y += 3) {
          grassParticles.push({
            x: p.width,
            y,
            height: p.random(20, 40),
            swayOffset: p.random(p.TWO_PI),
            side: "right",
          });
        }
      };

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        canvas.parent(containerRef.current!);

        layer = p.createGraphics(p.width, p.height);
        layer.textAlign(p.CENTER, p.CENTER);
        layer.textFont("serif");

        initializeGrass();

        // Initialize kanji particles
        for (let i = 0; i < 20; i++) {
          const kanjiChar = kanji[Math.floor(p.random(kanji.length))];
          particles.push({
            x: p.random(p.width),
            y: p.random(p.height),
            size: p.random(20, 60),
            speed: p.random(0.2, 0.6),
            char: kanjiChar.char,
            meaning: kanjiChar.meaning,
            rotation: p.random(p.TWO_PI),
            rotationSpeed: p.random(-0.01, 0.01),
            showMeaning: false,
            meaningTimer: 0,
            swayOffset: p.random(p.TWO_PI),
            meaningText: "",
            meaningProgress: 0,
          });
        }
      };

      const drawGrass = () => {
        layer.stroke(34, 197, 94, 50);
        layer.strokeWeight(1);

        grassParticles.forEach((grass) => {
          const swayAmount = p.sin(p.frameCount * 0.02 + grass.swayOffset) * 5;

          switch (grass.side) {
            case "bottom":
              layer.line(
                grass.x,
                grass.y,
                grass.x + swayAmount,
                grass.y - grass.height
              );
              break;
            case "top":
              layer.line(
                grass.x,
                grass.y,
                grass.x + swayAmount,
                grass.y + grass.height
              );
              break;
            case "left":
              layer.line(
                grass.x,
                grass.y,
                grass.x + grass.height,
                grass.y + swayAmount
              );
              break;
            case "right":
              layer.line(
                grass.x,
                grass.y,
                grass.x - grass.height,
                grass.y + swayAmount
              );
              break;
          }
        });
      };

      const getRandomCorner = () => {
        const corners: Array<
          "topLeft" | "topRight" | "bottomLeft" | "bottomRight"
        > = ["topLeft", "topRight", "bottomLeft", "bottomRight"];

        // Filter out the last used corner
        const availableCorners = corners.filter(
          (corner) => corner !== lastCorner
        );
        const corner =
          availableCorners[Math.floor(p.random(availableCorners.length))];
        lastCorner = corner;

        const padding = 150; // Padding from the edges
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

      const revealKanji = () => {
        if (revealingKanji) return;

        const now = p.millis();
        if (now - lastRevealTime < 8000) return; // Wait 8 seconds between reveals

        const particle = particles[Math.floor(p.random(particles.length))];
        if (!particle) return;

        const { x, y, corner } = getRandomCorner();

        revealingKanji = {
          ...particle,
          originalX: particle.x,
          originalY: particle.y,
          targetX: x,
          targetY: y,
          corner,
          transitionProgress: 0,
          meaningText: "",
          meaningProgress: 0,
        };

        lastRevealTime = now;

        // Remove the particle from the normal flow
        particles = particles.filter((p) => p !== particle);
      };

      p.draw = () => {
        p.clear();
        layer.clear();
        layer.noStroke();

        // Draw grass
        drawGrass();

        // Maybe start a new kanji reveal
        if (p.random() < 0.005 && !revealingKanji) {
          revealKanji();
        }

        // Handle revealing kanji
        if (revealingKanji) {
          revealingKanji.transitionProgress = Math.min(
            1,
            (revealingKanji.transitionProgress || 0) + 0.02
          );
          const easeProgress = ease(revealingKanji.transitionProgress, 0.1);

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

          // Draw the kanji
          layer.push();
          layer.translate(x, y);

          // Draw shadow and main kanji
          layer.fill(34, 197, 94, 180 * easeProgress);
          layer.textSize(80);
          layer.text(revealingKanji.char, 2, 2);
          layer.text(revealingKanji.char, 0, 0);

          // Handle meaning reveal with position based on corner
          if (easeProgress > 0.8) {
            revealingKanji.meaningProgress = Math.min(
              1,
              revealingKanji.meaningProgress + 0.05
            );
            const meaningLength = Math.floor(
              revealingKanji.meaning.length * revealingKanji.meaningProgress
            );
            revealingKanji.meaningText = revealingKanji.meaning.slice(
              0,
              meaningLength
            );

            layer.textSize(30);
            layer.fill(34, 197, 94, 180 * revealingKanji.meaningProgress);

            // Position meaning text based on corner
            const meaningOffset = 80;
            let meaningX = 0,
              meaningY = 0;

            switch (revealingKanji.corner) {
              case "topLeft":
                meaningX = meaningOffset;
                meaningY = meaningOffset;
                break;
              case "topRight":
                meaningX = -meaningOffset;
                meaningY = meaningOffset;
                break;
              case "bottomLeft":
                meaningX = meaningOffset;
                meaningY = -meaningOffset;
                break;
              case "bottomRight":
                meaningX = -meaningOffset;
                meaningY = -meaningOffset;
                break;
            }

            layer.text(revealingKanji.meaningText, meaningX, meaningY);
          }

          layer.pop();

          // Reset after complete
          if (
            revealingKanji.transitionProgress >= 1 &&
            revealingKanji.meaningProgress >= 1
          ) {
            setTimeout(() => {
              if (revealingKanji) {
                particles.push({
                  ...revealingKanji,
                  x: p.random(p.width),
                  y: p.height + 50,
                  showMeaning: false,
                  meaningTimer: 0,
                  meaningText: "",
                  meaningProgress: 0,
                });
                revealingKanji = null;
              }
            }, 2000);
          }
        }

        // Update and draw regular particles
        particles.forEach((particle) => {
          particle.y -= particle.speed;
          particle.rotation += particle.rotationSpeed;

          if (particle.y < -50) {
            particle.y = p.height + 50;
            particle.x = p.random(p.width);
          }

          const baseAlpha = mode === "intro" ? 220 : 180;
          const distanceFromCenter = p.abs(particle.x - p.width / 2) / p.width;
          const fadeEffect = 1 - distanceFromCenter * 0.3;

          const sway = p.sin(p.frameCount * 0.02 + particle.swayOffset) * 3;
          const finalX = particle.x + sway;

          layer.push();
          layer.translate(finalX, particle.y);
          layer.rotate(particle.rotation);

          layer.fill(34, 197, 94, baseAlpha * fadeEffect * 0.2);
          layer.textSize(particle.size);
          layer.text(particle.char, 2, 2);

          layer.fill(34, 197, 94, baseAlpha * fadeEffect);
          layer.text(particle.char, 0, 0);

          layer.pop();
        });

        p.image(layer, -p.width / 2, -p.height / 2);
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        layer.resizeCanvas(p.width, p.height);
        initializeGrass();
      };
    };

    p5Instance.current = new p5(sketch);

    return () => {
      p5Instance.current?.remove();
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
