import { useState, useEffect, useCallback } from "react";

export function useAudioPlayer() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<string | null>(
    null
  );

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [audio]);

  const togglePlaySong = useCallback(
    (songPath: string) => {
      if (audio) {
        if (currentPlayingSong === songPath) {
          if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
          } else {
            audio.play();
            setIsPlaying(true);
          }
        } else {
          audio.pause();
          audio.currentTime = 0;
          const newAudio = new Audio(songPath);
          newAudio.play();
          setAudio(newAudio);
          setCurrentPlayingSong(songPath);
          setIsPlaying(true);
        }
      } else {
        const newAudio = new Audio(songPath);
        newAudio.play();
        setAudio(newAudio);
        setCurrentPlayingSong(songPath);
        setIsPlaying(true);
      }
    },
    [audio, currentPlayingSong, isPlaying]
  );

  return {
    isPlaying,
    currentPlayingSong,
    togglePlaySong,
  };
}
