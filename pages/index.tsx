import { useState, useEffect } from "react";
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
    console.log("Starting getServerSideProps");

    const groupId =
      (context.query.groupId as string) || process.env.PINATA_GROUP_ID;
    console.log("Using groupId:", groupId);

    if (!groupId) {
      console.log("No groupId found, returning empty images array");
      return {
        props: {
          images: [],
        },
      };
    }

    console.log("Fetching images with groupId:", groupId);
    const images = await getImages(groupId);
    console.log("Fetched images count:", images.length);

    // Sort images by dateModified
    const sortedImages = [...images].sort((a, b) => {
      if (!a.dateModified || !b.dateModified) return 0;
      return (
        new Date(a.dateModified).getTime() - new Date(b.dateModified).getTime()
      );
    });
    console.log("Sorted images count:", sortedImages.length);

    return {
      props: {
        images: sortedImages,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return {
      props: {
        images: [],
      },
    };
  }
};

export default function Home({ images }: HomeProps) {
  console.log("Home Page Mounted");

  useEffect(() => {
    try {
      console.log("Home Page Effect Running");
      console.log("Environment Check:", {
        gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
        nodeEnv: process.env.NODE_ENV,
      });
    } catch (error) {
      console.error("Error in Home page mount:", error);
    }
  }, []);

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
