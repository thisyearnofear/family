import React, { useEffect, useRef } from "react";
import p5 from "p5";

interface ZenBackgroundProps {
  mode?: "intro" | "story";
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  char: string;
  rotation: number;
  rotationSpeed: number;
}

const ZenBackground: React.FC<ZenBackgroundProps> = ({ mode = "story" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5>();

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let layer: p5.Graphics;
      const kanji = [
        "愛", // Love
        "家", // Family/Home
        "絆", // Bonds/Connections
        "情", // Feelings/Emotion
        "恩", // Kindness/Grace
        "縁", // Destiny/Connection
        "幸", // Happiness
        "祈", // Prayer/Wish
        "夢", // Dreams
        "心", // Heart
        "親", // Parent/Intimacy
        "恋", // Love/Affection
      ];
      let particles: Particle[] = [];

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        canvas.parent(containerRef.current!);

        // Create single layer for kanji
        layer = p.createGraphics(p.width, p.height);
        layer.textAlign(p.CENTER, p.CENTER);
        layer.textFont("serif");

        // Initialize particles with more varied properties
        for (let i = 0; i < 40; i++) {
          particles.push({
            x: p.random(p.width),
            y: p.random(p.height),
            size: p.random(20, 60), // Larger size range
            speed: p.random(0.3, 0.8),
            char: kanji[Math.floor(p.random(kanji.length))],
            rotation: p.random(p.TWO_PI),
            rotationSpeed: p.random(-0.02, 0.02),
          });
        }
      };

      p.draw = () => {
        p.clear();
        layer.clear();
        layer.noStroke();

        particles.forEach((particle, i) => {
          // Update particle position with wrapping
          particle.y -= particle.speed;
          particle.rotation += particle.rotationSpeed;

          if (particle.y < -50) {
            particle.y = p.height + 50;
            particle.x = p.random(p.width);
          }

          // Create more prominent kanji
          const baseAlpha = mode === "intro" ? 220 : 180;
          const distanceFromCenter = p.abs(particle.x - p.width / 2) / p.width;
          const fadeEffect = 1 - distanceFromCenter * 0.3;

          layer.push();
          layer.translate(
            particle.x + p.sin(p.frameCount * 0.015 + i) * 20,
            particle.y
          );
          layer.rotate(particle.rotation);

          // Add subtle shadow for depth
          layer.fill(220, 38, 38, baseAlpha * fadeEffect * 0.2);
          layer.text(particle.char, 2, 2);

          // Main kanji
          layer.fill(220, 38, 38, baseAlpha * fadeEffect);
          layer.textSize(particle.size);
          layer.text(particle.char, 0, 0);
          layer.pop();
        });

        // Draw the layer
        p.image(layer, -p.width / 2, -p.height / 2);
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        layer.resizeCanvas(p.width, p.height);
      };
    };

    // Create new P5 instance
    p5Instance.current = new p5(sketch);

    // Cleanup
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
