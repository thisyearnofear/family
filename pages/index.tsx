import { useState, useEffect } from "react";
import { useTheme } from "@contexts/ThemeContext";
import WelcomeScreen from "@components/ui/WelcomeScreen";
import SpaceTimeline from "@components/timeline/SpaceTimeline";
import JapaneseTimeline from "@components/timeline/JapaneseTimeline";
import PageTransition from "@components/layout/PageTransition";
import { useTimeline } from "@contexts/TimelineContext";
import type { ImageProps } from "@utils/types";
import { getImages } from "@utils/api/pinata";
import { createGift } from "@utils/api/gifts";
import type { GetServerSideProps } from "next";
import CreateGiftFlow from "@components/ui/CreateGiftFlow";

interface HomeProps {
  images: ImageProps[];
  error?: string;
  debug?: {
    env: string;
    hasJwt: boolean;
    hasGroupId: boolean;
    imagesCount?: number;
    error?: boolean;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Log the entire context and environment for debugging
    console.log("=== SERVER SIDE PROPS START ===");
    console.log("Context:", {
      ...context,
      req: {
        ...context.req,
        headers: context.req?.headers,
        url: context.req?.url,
      },
    });

    console.log("Environment variables:", {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NETLIFY_ENV: process.env.NETLIFY_ENV,
      NETLIFY: process.env.NETLIFY,
      PINATA_JWT: !!process.env.PINATA_JWT,
      PINATA_GROUP_ID: process.env.PINATA_GROUP_ID,
      NEXT_PUBLIC_PINATA_GATEWAY: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
    });

    // Use environment variable directly instead of query param for production
    const groupId = process.env.PINATA_GROUP_ID;
    console.log("Using groupId:", groupId);

    if (!groupId) {
      console.error("No PINATA_GROUP_ID found in environment variables");
      throw new Error("PINATA_GROUP_ID is not configured");
    }

    if (!process.env.PINATA_JWT) {
      console.error("No PINATA_JWT found in environment variables");
      throw new Error("PINATA_JWT is not configured");
    }

    console.log("Fetching images with groupId:", groupId);
    const images = await getImages(groupId);
    console.log("Fetched images count:", images.length);

    if (!images.length) {
      console.warn("No images returned from Pinata");
    }

    // Sort images by dateTaken
    const sortedImages = [...images].sort((a, b) => {
      if (!a.dateTaken || !b.dateTaken) return 0;
      return new Date(a.dateTaken).getTime() - new Date(b.dateTaken).getTime();
    });
    console.log("Sorted images count:", sortedImages.length);
    console.log("=== SERVER SIDE PROPS END ===");

    return {
      props: {
        images: sortedImages,
        debug: {
          env: process.env.NODE_ENV,
          hasJwt: !!process.env.PINATA_JWT,
          hasGroupId: !!process.env.PINATA_GROUP_ID,
          imagesCount: sortedImages.length,
        },
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
        debug: {
          env: process.env.NODE_ENV,
          hasJwt: !!process.env.PINATA_JWT,
          hasGroupId: !!process.env.PINATA_GROUP_ID,
          error: true,
        },
      },
    };
  }
};

export default function Home({ images, error, debug }: HomeProps) {
  console.log("Home Page Mounted", {
    imagesCount: images.length,
    hasError: !!error,
    debug,
  });

  useEffect(() => {
    try {
      console.log("Home Page Effect Running");
      console.log("Client Environment Check:", {
        gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
        nodeEnv: process.env.NODE_ENV,
        imagesLoaded: images.length,
        error,
        debug,
      });
    } catch (error) {
      console.error("Error in Home page mount:", error);
    }
  }, [images.length, error, debug]);

  const { theme } = useTheme();
  const [hasSelectedTheme, setHasSelectedTheme] = useState(false);
  const [isAutoHighlighting, setIsAutoHighlighting] = useState(true);
  const [showGiftFlow, setShowGiftFlow] = useState(false);
  const [isCreatingGift, setIsCreatingGift] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);

  // Show error if there is one
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Images
          </h1>
          <p className="text-gray-700">{error}</p>
          <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
            <h2 className="font-semibold mb-2">Debug Information:</h2>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Please try refreshing the page or contact support if the issue
            persists.
          </p>
        </div>
      </div>
    );
  }

  const handleGiftComplete = async (data: {
    theme: "space" | "japanese";
    messages: string[];
    photos: ImageProps[];
    giftId: string;
  }) => {
    setIsCreatingGift(true);
    setGiftError(null);

    try {
      const gift = await createGift({
        theme: data.theme,
        messages: data.messages,
        photos: data.photos,
        groupId: data.giftId,
        musicPreference: {
          volume: 0.5,
          isPlaying: true,
        },
      });

      console.log("Gift created:", gift);
      setShowGiftFlow(false);

      // Show success message and copy gift ID to clipboard
      await navigator.clipboard.writeText(gift.id);
      alert(
        `Gift created successfully! ID: ${gift.id}\n\nThe ID has been copied to your clipboard.`
      );
    } catch (error) {
      console.error("Error creating gift:", error);
      setGiftError(
        error instanceof Error ? error.message : "Failed to create gift"
      );
    } finally {
      setIsCreatingGift(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PageTransition isPresent={!hasSelectedTheme}>
        <WelcomeScreen
          onThemeSelect={() => {
            // Delay the state change to allow for exit animation
            setTimeout(() => setHasSelectedTheme(true), 300);
          }}
          onCreateGift={() => setShowGiftFlow(true)}
        />
      </PageTransition>

      <PageTransition isPresent={hasSelectedTheme} theme={theme}>
        {theme === "space" ? (
          <SpaceTimeline
            images={images}
            isAutoHighlighting={isAutoHighlighting}
            setIsAutoHighlighting={setIsAutoHighlighting}
          />
        ) : (
          <JapaneseTimeline
            images={images}
            isAutoHighlighting={isAutoHighlighting}
            setIsAutoHighlighting={setIsAutoHighlighting}
          />
        )}
      </PageTransition>

      {showGiftFlow && (
        <CreateGiftFlow
          onClose={() => setShowGiftFlow(false)}
          onComplete={handleGiftComplete}
        />
      )}
    </div>
  );
}
