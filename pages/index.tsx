import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import WelcomeScreen from "../components/WelcomeScreen";
import SpaceTimeline from "../components/SpaceTimeline";
import JapaneseTimeline from "../components/JapaneseTimeline";
import type { ImageProps } from "../utils/types";
import { getImages } from "../utils/pinata";
import type { GetServerSideProps } from "next";

interface HomeProps {
  images: ImageProps[];
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const images = await getImages(process.env.PINATA_GROUP_ID);
    return {
      props: {
        images,
      },
    };
  } catch (error) {
    console.error("Error fetching images:", error);
    return {
      props: {
        images: [],
      },
    };
  }
};

export default function Home({ images }: HomeProps) {
  const { theme } = useTheme();
  const [hasSelectedTheme, setHasSelectedTheme] = useState(false);

  if (!hasSelectedTheme) {
    return <WelcomeScreen onThemeSelect={() => setHasSelectedTheme(true)} />;
  }

  return theme === "space" ? (
    <SpaceTimeline images={images} />
  ) : (
    <JapaneseTimeline images={images} />
  );
}
