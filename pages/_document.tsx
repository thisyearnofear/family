import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta
            name="description"
            content="A gallery to commemorate my family and friends."
            key="desc"
          />

          <meta name="og:url" content="commemorationgallery.vercel.app" />
          <meta name="og:site_name" content="commemorationgallery.vercel.app" />
          <meta name="og:title" content="2024 Commemoration Gallery. " />
          <meta
            name="og:description"
            content="A gallery to commemorate my family and friends."
          />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="2024 Commemoration Gallery. " />
          <meta
            name="twitter:description"
            content="A gallery to commemorate my family and friends."
          />
        </Head>
        <body className="bg-black antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
