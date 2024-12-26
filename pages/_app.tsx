import type { AppProps } from "next/app";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../styles/index.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
