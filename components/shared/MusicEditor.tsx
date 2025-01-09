import React from "react";
import { MusicSelection } from "./MusicSelection";

interface MusicEditorProps {
  selectedSongs: string[];
  onChange: (songs: string[]) => void;
}

export function MusicEditor({
  selectedSongs,
  onChange,
}: MusicEditorProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center">Edit Music</h2>
      <MusicSelection selectedSongs={selectedSongs} onSongSelect={onChange} />
    </div>
  );
}
