import type { AppProps } from "next/app";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TimelineProvider } from "../contexts/TimelineContext";
import "../styles/index.css";
import { useEffect } from "react";

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const updateVH = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    updateVH();
    window.addEventListener("resize", updateVH);
    return () => window.removeEventListener("resize", updateVH);
  }, []);

  return (
    <ThemeProvider>
      <TimelineProvider>
        <Component {...pageProps} />
      </TimelineProvider>
    </ThemeProvider>
  );
}
