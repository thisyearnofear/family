import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import Modal from "../components/Modal";
import { getImages, IPFSImage } from "../utils/pinata";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";

const Home: NextPage = ({ images }: { images: ImageProps[] }) => {
  const router = useRouter();
  const { photoId } = router.query;
  const [lastViewedPhoto, setLastViewedPhoto] = useLastViewedPhoto();

  const lastViewedPhotoRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // This effect keeps track of the last viewed photo in the modal to keep the index page in sync when the user navigates back
    if (lastViewedPhoto && !photoId) {
      lastViewedPhotoRef.current.scrollIntoView({ block: "center" });
      setLastViewedPhoto(null);
    }
  }, [photoId, lastViewedPhoto, setLastViewedPhoto]);

  return (
    <>
      <Head>
        <title>2024 Commemoration Gallery</title>
        <meta property="og:image" content="/baby-aldrei.jpg" />
        <meta name="twitter:image" content="/baby-aldrei.jpg" />
      </Head>
      <main className="mx-auto max-w-[1960px] p-4">
        {photoId && (
          <Modal
            images={images}
            onClose={() => {
              setLastViewedPhoto(photoId);
            }}
          />
        )}
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          <div className="after:content relative mb-5 flex h-[629px] flex-col items-center justify-end gap-4 overflow-hidden rounded-lg bg-white/10 px-6 pb-16 pt-64 text-center text-white shadow-highlight after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight lg:pt-0">
            <div className="absolute inset-0 flex items-center justify-center opacity-20 brightness-200">
              <span className="flex max-h-full max-w-full items-center justify-center">
                <Image
                  alt="Leafless"
                  src="/leafless.png"
                  width={720}
                  height={480}
                  sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
                />
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-b from-black/0 via-black to-black"></span>
            </div>
            <h1 className="mb-4 mt-8 text-base font-bold uppercase tracking-widest">
              2024 Commemoration Gallery
            </h1>
            <p className="max-w-[40ch] text-white/75 sm:max-w-[32ch]">
              A gallery to commemorate my family and friends. Celebrating
              milestones, memories (especially funny ones), and connections that
              shaped our lives.
              <br />
              <br />
              The most important things in life are relationships, experiences,
              and memories.
            </p>
          </div>
          {images.map(({ id, ipfsHash, name }) => (
            <Link
              key={id}
              href={`/?photoId=${id}`}
              as={`/p/${id}`}
              ref={id === Number(lastViewedPhoto) ? lastViewedPhotoRef : null}
              shallow
              className="after:content group relative mb-5 block w-full cursor-zoom-in after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:shadow-highlight"
            >
              <Image
                alt={name}
                className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
                style={{ transform: "translate3d(0, 0, 0)" }}
                src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}${ipfsHash}`}
                width={720}
                height={480}
                sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
              />
            </Link>
          ))}
        </div>
      </main>
      <footer className="p-6 text-center text-white/80 sm:p-12">
        <a
          href="https://andreiportfolio.vercel.app"
          target="_blank"
          className="font-semibold hover:text-white"
          rel="noreferrer"
        >
          Andrei Sager
        </a>{" "}
        @ 2024 • Built with{" "}
        <a
          href="https://nextjs.org/"
          target="_blank"
          className="font-semibold hover:text-white"
          rel="noreferrer"
        >
          Next.js
        </a>
        ,{" "}
        <a
          href="https://vercel.com/"
          target="_blank"
          className="font-semibold hover:text-white"
          rel="noreferrer"
        >
          Vercel
        </a>
        ,{" "}
        <a
          href="https://cloudinary.com/"
          target="_blank"
          className="font-semibold hover:text-white"
          rel="noreferrer"
        >
          Cloudinary
        </a>
        .
      </footer>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const images = await getImages();

  // Convert IPFSImage to ImageProps
  const convertedImages: ImageProps[] = images.map((img) => ({
    id: img.id,
    height: img.height,
    width: img.width,
    ipfsHash: img.ipfsHash,
    name: img.name,
  }));

  return {
    props: {
      images: convertedImages,
    },
    revalidate: 60,
  };
};

export default Home;
