import { useTheme } from "../../contexts/ThemeContext";

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme("space")}
        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
          theme === "space"
            ? "bg-blue-600 text-white"
            : "bg-blue-100 text-blue-900 hover:bg-blue-200"
        }`}
      >
        <span>Space Journey</span>
        <span>🚀</span>
      </button>
      <button
        onClick={() => setTheme("japanese")}
        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
          theme === "japanese"
            ? "bg-red-600 text-white"
            : "bg-red-100 text-red-900 hover:bg-red-200"
        }`}
      >
        <span>Zen Garden</span>
        <span>🌳</span>
      </button>
    </div>
  );
};

export default ThemeSelector;
