import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <title>2024 Commemoration Gallery</title>
          <link rel="icon" href="/favicon.ico" />
          <meta
            name="description"
            content="A gallery to commemorate my family and friends."
            key="desc"
          />

          <meta
            property="og:site_name"
            content="commemorationgallery.vercel.app"
          />
          <meta property="og:title" content="2024 Commemoration Gallery. " />
          <meta
            property="og:description"
            content="A gallery to commemorate my family and friends."
          />
          <meta property="og:image" content="/baby-aldrei.jpg" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="2024 Commemoration Gallery. " />
          <meta
            name="twitter:description"
            content="A gallery to commemorate my family and friends."
          />
          <meta name="twitter:image" content="/baby-aldrei.jpg" />
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
