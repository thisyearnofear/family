import type { AppProps } from "next/app";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TimelineProvider } from "../contexts/TimelineContext";
import "../styles/index.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <TimelineProvider>
        <Component {...pageProps} />
      </TimelineProvider>
    </ThemeProvider>
  );
}
