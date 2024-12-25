import { ThemeProvider } from "../contexts/ThemeContext";
import Timeline from "../components/Timeline";
import type { ImageProps } from "../utils/types";

interface HomeProps {
  images: ImageProps[];
}

export default function Home({ images }: HomeProps) {
  return (
    <ThemeProvider>
      <Timeline images={images} />
    </ThemeProvider>
  );
}
