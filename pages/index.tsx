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
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    console.log("Starting getServerSideProps");
    console.log("Environment variables:", {
      PINATA_JWT: !!process.env.PINATA_JWT,
      PINATA_GROUP_ID: process.env.PINATA_GROUP_ID,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Use environment variable directly instead of query param for production
    const groupId = process.env.PINATA_GROUP_ID;
    console.log("Using groupId:", groupId);

    if (!groupId) {
      console.error("No PINATA_GROUP_ID found in environment variables");
      return {
        props: {
          images: [],
        },
      };
    }

    if (!process.env.PINATA_JWT) {
      console.error("No PINATA_JWT found in environment variables");
      return {
        props: {
          images: [],
        },
      };
    }

    console.log("Fetching images with groupId:", groupId);
    const images = await getImages(groupId);
    console.log("Fetched images count:", images.length);

    if (!images.length) {
      console.error("No images returned from Pinata");
    }

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
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
};

export default function Home({ images, error }: HomeProps) {
  console.log("Home Page Mounted", {
    imagesCount: images.length,
    hasError: !!error,
  });

  useEffect(() => {
    try {
      console.log("Home Page Effect Running");
      console.log("Environment Check:", {
        gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
        nodeEnv: process.env.NODE_ENV,
        imagesLoaded: images.length,
        error,
      });
    } catch (error) {
      console.error("Error in Home page mount:", error);
    }
  }, [images.length, error]);

  const { theme } = useTheme();
  const [hasSelectedTheme, setHasSelectedTheme] = useState(false);

  // Show error if there is one
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Images
          </h1>
          <p className="text-gray-700">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Please try refreshing the page or contact support if the issue
            persists.
          </p>
        </div>
      </div>
    );
  }

  if (!hasSelectedTheme) {
    return <WelcomeScreen onThemeSelect={() => setHasSelectedTheme(true)} />;
  }

  return theme === "space" ? (
    <SpaceTimeline images={images} />
  ) : (
    <JapaneseTimeline images={images} />
  );
}
