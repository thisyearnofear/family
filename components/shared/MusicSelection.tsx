import {
  CheckCircleIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { SONGS } from "@utils/constants";
import { useAudioPlayer } from "@hooks/useAudioPlayer";

interface MusicSelectionProps {
  selectedSongs: string[];
  onSongSelect: (songs: string[]) => void;
}

export function MusicSelection({
  selectedSongs,
  onSongSelect,
}: MusicSelectionProps) {
  const { isPlaying, currentPlayingSong, togglePlaySong } = useAudioPlayer();

  return (
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-semibold">Select Music (Max 2)</h3>
      <p className="text-sm text-gray-600 mb-6">
        by{" "}
        <a
          href="https://open.spotify.com/artist/3yhUYybUxwJn1or7zHXWHy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          PAPA
        </a>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SONGS.map((song) => (
          <div
            key={song.path}
            className={`p-4 rounded-lg border ${
              selectedSongs.includes(song.path)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            } hover:border-blue-300 transition-colors cursor-pointer`}
            onClick={() => {
              if (selectedSongs.includes(song.path)) {
                onSongSelect(selectedSongs.filter((s) => s !== song.path));
              } else if (selectedSongs.length < 2) {
                onSongSelect([...selectedSongs, song.path]);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{song.title}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlaySong(song.path);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  {currentPlayingSong === song.path && isPlaying ? (
                    <PauseIcon className="w-5 h-5" />
                  ) : (
                    <PlayIcon className="w-5 h-5" />
                  )}
                </button>
                {selectedSongs.includes(song.path) && (
                  <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedSongs.length > 0 && (
        <p className="text-sm text-gray-600">
          Selected: {selectedSongs.length}/2 songs
        </p>
      )}
    </div>
  );
}
