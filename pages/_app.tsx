import type { AppProps } from "next/app";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TimelineProvider } from "../contexts/TimelineContext";
import { Web3Provider } from "@components/providers/Web3Provider";
import "../styles/index.css";
import { useEffect } from "react";

// Pages that require Web3 functionality
const WEB3_PAGES = {
  edit: "/edit",
  create: "/create",
} as const;

export default function MyApp({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    // Fix for mobile viewport height
    const updateVH = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    updateVH();
    window.addEventListener("resize", updateVH);
    return () => window.removeEventListener("resize", updateVH);
  }, []);

  return (
    <Web3Provider>
      <ThemeProvider>
        <TimelineProvider>
          <Component {...pageProps} />
        </TimelineProvider>
      </ThemeProvider>
    </Web3Provider>
  );
}
