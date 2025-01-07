import { useState, useEffect } from "react";
import type { NextPage } from "next";
import dynamic from "next/dynamic";
import type { ImageProps } from "@utils/types/types";
import type { CreateGiftData } from "@utils/types/gift";

// Dynamically import components
const WelcomeScreen = dynamic(
  () => import("@components/ui/WelcomeScreen").then((mod) => mod.default),
  {
    ssr: false,
  }
);

const CreateGiftFlow = dynamic(
  () => import("@components/ui/CreateGiftFlow").then((mod) => mod.default),
  {
    ssr: false,
  }
);

const SpaceIntro = dynamic(
  () => import("@components/themes/SpaceIntro").then((mod) => mod.default),
  {
    ssr: false,
  }
);

const JapaneseIntro = dynamic(
  () => import("@components/themes/JapaneseIntro").then((mod) => mod.default),
  {
    ssr: false,
  }
);

const SpaceTimeline = dynamic(
  () => import("@components/timeline/SpaceTimeline").then((mod) => mod.default),
  {
    ssr: false,
  }
);

const JapaneseTimeline = dynamic(
  () =>
    import("@components/timeline/JapaneseTimeline").then((mod) => mod.default),
  {
    ssr: false,
  }
);

const Home: NextPage = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreateGift, setShowCreateGift] = useState(false);
  const [images, setImages] = useState<ImageProps[]>([]);
  const [giftId, setGiftId] = useState<string | null>(null);
  const [giftTheme, setGiftTheme] = useState<"space" | "japanese" | null>(null);
  const [isAutoHighlighting, setIsAutoHighlighting] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [music, setMusic] = useState<string[]>([]);
  const [title, setTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    console.log("Home Page Mounted", {
      imagesCount: images.length,
      hasError: false,
      debug: {
        showWelcome,
        showCreateGift,
        hasGiftId: !!giftId,
        theme: giftTheme,
        isDemo,
      },
    });
  }, [images.length, showWelcome, showCreateGift, giftId, giftTheme, isDemo]);

  const handleCreateGift = () => {
    setShowCreateGift(true);
    setShowWelcome(false);
  };

  const handleGiftComplete = async (data: CreateGiftData) => {
    // Reset state and return to welcome screen
    setGiftId(null);
    setImages([]);
    setGiftTheme(null);
    setShowCreateGift(false);
    setShowWelcome(true);
  };

  const handleUnwrapGift = (
    unwrappedImages: ImageProps[],
    unwrappedGiftId: string,
    theme: "space" | "japanese",
    unwrappedMessages?: string[],
    unwrappedMusic?: string[],
    unwrappedTitle?: string
  ) => {
    console.log("🎁 handleUnwrapGift called:", {
      giftId: unwrappedGiftId,
      theme,
      isDemo: unwrappedGiftId.startsWith("demo-"),
      currentState: {
        showWelcome,
        giftTheme,
      },
    });

    // Set all content
    setGiftId(unwrappedGiftId);
    setImages(unwrappedImages);
    setGiftTheme(theme);
    setMessages(unwrappedMessages || []);
    setMusic(unwrappedMusic || []);
    setTitle(unwrappedTitle);
    setShowWelcome(false);
    setIsDemo(unwrappedGiftId.startsWith("demo-"));

    console.log("🎁 State updated in handleUnwrapGift:", {
      showWelcome: false,
      isDemo: unwrappedGiftId.startsWith("demo-"),
      theme,
    });
  };

  if (showCreateGift) {
    return (
      <CreateGiftFlow
        onClose={() => {
          setShowCreateGift(false);
          setShowWelcome(true);
        }}
        onComplete={handleGiftComplete}
        onGiftCreated={(giftId) => {
          setGiftId(giftId);
        }}
      />
    );
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        onCreateGift={handleCreateGift}
        onUnwrapGift={handleUnwrapGift}
      />
    );
  }

  if (giftTheme === "space") {
    return (
      <SpaceTimeline
        images={images}
        messages={messages}
        music={music}
        title={title}
        isAutoHighlighting={isAutoHighlighting}
        setIsAutoHighlighting={setIsAutoHighlighting}
      />
    );
  }

  if (giftTheme === "japanese") {
    return (
      <JapaneseTimeline
        images={images}
        messages={messages}
        music={music}
        title={title}
        isAutoHighlighting={isAutoHighlighting}
        setIsAutoHighlighting={setIsAutoHighlighting}
      />
    );
  }

  return null;
};

export default Home;
