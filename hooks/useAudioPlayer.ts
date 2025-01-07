import { useState, useEffect, useCallback } from "react";
import useSound from "use-sound";
import { SONGS, type Song } from "../utils/constants";

interface AudioPlayerState {
  isPlaying: boolean;
  currentSongIndex: number;
}

interface AudioPlayerHook {
  isPlaying: boolean;
  currentPlayingSong: string;
  togglePlaySong: (songPath?: string) => void;
}

export function useAudioPlayer(): AudioPlayerHook {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentSongIndex: 0,
  });

  const [play, { stop, sound }] = useSound(SONGS[state.currentSongIndex].path, {
    volume: 0.5,
    interrupt: true,
    onend: () => {
      // When song ends naturally, move to next song
      if (state.isPlaying) {
        setState((prev) => ({
          ...prev,
          currentSongIndex: (prev.currentSongIndex + 1) % SONGS.length,
        }));
      }
    },
  });

  // Keep track of current sound instance
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unload();
      }
    };
  }, [sound]);

  const togglePlaySong = useCallback(
    (songPath?: string) => {
      if (songPath) {
        const songIndex = SONGS.findIndex(
          (song: Song) => song.path === songPath
        );
        if (songIndex !== -1) {
          if (sound) {
            sound.stop();
          }
          setState((prev) => ({
            currentSongIndex: songIndex,
            isPlaying: true,
          }));
        }
      } else {
        setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      }
    },
    [sound]
  );

  // Handle play/pause
  useEffect(() => {
    if (!sound) return;

    if (state.isPlaying) {
      sound.play();
    } else {
      sound.pause();
    }

    return () => {
      if (sound && !state.isPlaying) {
        sound.pause();
      }
    };
  }, [state.isPlaying, sound]);

  return {
    isPlaying: state.isPlaying,
    currentPlayingSong: SONGS[state.currentSongIndex].path,
    togglePlaySong,
  };
}
