import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import type { ImageProps } from "../utils/types";
import useSound from "use-sound";
import {
  SpeakerWaveIcon as VolumeUpIcon,
  SpeakerXMarkIcon as VolumeOffIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

interface SpaceTimelineProps {
  images: ImageProps[];
}

const SpaceTimeline: React.FC<SpaceTimelineProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);

  const [play, { pause, sound }] = useSound("/sounds/background-music.mp3", {
    volume,
    loop: true,
  });

  useEffect(() => {
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, play, pause]);

  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
  }, [volume, sound]);

  // Add scroll-driven animations for the photos
  useEffect(() => {
    if (!containerRef.current) return;

    const style = document.createElement("style");
    style.textContent = `
      .timeline-section {
        view-timeline-name: --section;
        view-timeline-axis: block;
      }

      .photo-container {
        view-timeline-name: --photo;
        view-timeline-axis: block;
      }

      .photo-container {
        animation: photo-reveal linear;
        animation-timeline: --photo;
        animation-range: entry 10% cover 30%;
      }

      .photo-container img {
        animation: photo-scale linear;
        animation-timeline: --photo;
        animation-range: entry 10% cover 30%;
      }

      .month-title {
        animation: slide-in linear;
        animation-timeline: --section;
        animation-range: entry 0% cover 20%;
      }

      @keyframes photo-reveal {
        from {
          opacity: 0;
          transform: perspective(1000px) rotateX(10deg) translateY(50px);
        }
        to {
          opacity: 1;
          transform: perspective(1000px) rotateX(0) translateY(0);
        }
      }

      @keyframes photo-scale {
        from {
          transform: scale(1.2);
        }
        to {
          transform: scale(1);
        }
      }

      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateX(-50px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Parallax effect for photos */
      .photo-parallax {
        animation: parallax linear;
        animation-timeline: scroll(root);
        animation-range: contain;
      }

      @keyframes parallax {
        from {
          transform: translateY(0);
        }
        to {
          transform: translateY(-50px);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.3, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1]);

  // Group images by month
  const groupedImages = useMemo(() => {
    return images.reduce(
      (groups: { month: string; images: ImageProps[] }[], image) => {
        if (!image.dateTaken) return groups;
        const month = new Date(image.dateTaken).toLocaleString("default", {
          month: "long",
        });
        const existingGroup = groups.find((g) => g.month === month);
        if (existingGroup) {
          existingGroup.images.push(image);
        } else {
          groups.push({ month, images: [image] });
        }
        return groups;
      },
      []
    );
  }, [images]);

  return (
    <div ref={containerRef} className="relative min-h-screen py-20">
      {/* Music Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-8 right-8 z-50 bg-black/80 backdrop-blur-lg rounded-full p-4 flex items-center gap-4 border border-white/10"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6 text-white" />
            ) : (
              <PlayIcon className="w-6 h-6 text-white" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 accent-purple-500"
          />
          {volume === 0 ? (
            <VolumeOffIcon className="w-6 h-6 text-white" />
          ) : (
            <VolumeUpIcon className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="text-white/80 text-sm">
          Now Playing: "Hopes and Dreams" by Papa
        </div>
      </motion.div>

      {/* Timeline Content */}
      <div className="relative z-10">
        <motion.div
          className="max-w-7xl mx-auto px-4"
          style={{ opacity, scale }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {groupedImages.map((group, groupIndex) => (
            <motion.section
              key={group.month}
              className="timeline-section mb-20"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="mb-8 relative">
                <h2 className="month-title text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                  {group.month}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {group.images.map((image) => (
                  <div
                    key={image.id}
                    className="photo-container relative aspect-[3/2] rounded-xl overflow-hidden group hover:z-10"
                  >
                    <div className="photo-parallax w-full h-full">
                      <Image
                        alt={image.dateTaken || "Memory"}
                        className="transform rounded-xl brightness-90 transition will-change-auto group-hover:brightness-110 group-hover:scale-110 duration-700 object-cover"
                        style={{ transform: "translate3d(0, 0, 0)" }}
                        src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${image.ipfsHash}`}
                        fill
                        sizes="(max-width: 640px) 100vw,
                               (max-width: 1280px) 50vw,
                               (max-width: 1536px) 33vw,
                               25vw"
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      >
                        <div className="absolute bottom-4 left-4 text-white">
                          <p className="text-sm font-medium">
                            {new Date(image.dateTaken || "").toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SpaceTimeline;
