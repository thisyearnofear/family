import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import WelcomeScreen from "../components/ui/WelcomeScreen";
import SpaceTimeline from "../components/timeline/SpaceTimeline";
import JapaneseTimeline from "../components/timeline/JapaneseTimeline";
import { useTimeline } from "../contexts/TimelineContext";
import type { ImageProps } from "../utils/types/types";
import { getImages } from "../utils/pinata/pinata";
import type { GetServerSideProps } from "next";

interface HomeProps {
  images: ImageProps[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const groupId =
      (context.query.groupId as string) || process.env.PINATA_GROUP_ID;
    if (!groupId) {
      return {
        props: {
          images: [],
        },
      };
    }

    const images = await getImages(groupId);

    // Sort images by dateModified
    const sortedImages = [...images].sort((a, b) => {
      if (!a.dateModified || !b.dateModified) return 0;
      return (
        new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime()
      );
    });

    return {
      props: {
        images: sortedImages,
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
