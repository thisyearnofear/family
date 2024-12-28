# Memory Flow - Interactive Year-End Memory Experience

## Vision

Memory Flow is an interactive gift experience that lets you share your year's most meaningful moments with loved ones. It transforms your photos into an engaging story that celebrates connection, presented in either a serene Zen Garden or cosmic Space journey theme.

### Key Features

- **Password-Protected Experiences**: Each gift experience is private and accessible only with a password
- **Immersive Storytelling**: Photos flow naturally through an automated story mode with manual controls
- **Monthly Collections**: Photos are beautifully arranged in monthly collages
- **Grand Finale**: A stunning year-end collage that captures all moments
- **Theme Options**: Choose between Space and Zen Garden themes, each with unique animations
- **Gift Creation**: Recipients can create their own gift experiences to share
- **Decentralized Storage**: Uses IPFS/Pinata for secure, decentralized photo storage

## Technical Implementation

- Built with [Next.js](https://nextjs.org/) for seamless user experience
- Styled with [Tailwind CSS](https://tailwindcss.com/) for beautiful, responsive design
- Uses [Framer Motion](https://www.framer.com/motion/) for smooth animations
- Implements [IPFS](https://ipfs.tech/) via [Pinata](https://www.pinata.cloud/) for decentralized storage
- Features [Three.js](https://threejs.org/) for immersive 3D backgrounds

## Project Structure

- `components/`: Reusable UI components including timelines and collages
- `contexts/`: React context providers for theme and auth state
- `hooks/`: Custom React hooks for shared functionality
- `pages/`: Next.js pages and API routes
- `utils/`: Utility functions and helpers
- `styles/`: Global styles and Tailwind configuration

## Development Roadmap

### Phase 1 - Core Experience (Current)

- [x] Basic timeline implementation
- [x] Theme switching (Space/Zen)
- [x] Photo navigation and viewing
- [x] Monthly collages
- [x] Animation and transitions

### Phase 2 - Gift Creation (In Progress)

- [ ] Password protection system
- [ ] Photo upload and IPFS integration
- [ ] Creation wizard interface
- [ ] Theme customization
- [ ] Message personalization

### Phase 3 - Enhancement

- [ ] Advanced collage layouts
- [ ] Additional themes
- [ ] Sharing mechanisms
- [ ] Mobile optimization
- [ ] Analytics integration

### Phase 4 - Monetization

- [ ] Payment integration
- [ ] Subscription/pricing models
- [ ] Premium features
- [ ] Gift vouchers

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   NEXT_PUBLIC_PINATA_GATEWAY=your_gateway_url
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

### Code

This project is licensed under the MIT License - see the LICENSE file for details.

### Media Content

All images and videos are licensed under [Creative Commons Attribution-NonCommercial-NoDerivs 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/).

---

Local settings

import Image from "next/image";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const DevImage = dynamic(
() => import("./DevImage").then((mod) => mod.default),
{ ssr: false }
);

interface LazyImageProps {
src: string;
alt: string;
className?: string;
priority?: boolean;
fill?: boolean;
width?: number;
height?: number;
sizes?: string;
quality?: number;
onLoad?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
src,
alt,
className = "",
priority = false,
fill = false,
width,
height,
sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
quality = 75,
onLoad,
}) => {
return <Image src={src} alt={alt} className={className} fill={fill} width={width} height={height} sizes={sizes} priority={priority} quality={quality} onLoad={onLoad} />;
};

export default LazyImage;

import Image from "next/image";
import { motion } from "framer-motion";
import type { ImageProps } from "../../utils/types/types";
import dynamic from "next/dynamic";

// Dynamically import DevImage only in development
const DevImage = dynamic(
() => import("./DevImage").then((mod) => mod.default),
{ ssr: false }
);

interface MemoryImageProps {
image: ImageProps;
priority?: boolean;
onLoad?: () => void;
className?: string;
isInteractive?: boolean;
}

const MemoryImage: React.FC<MemoryImageProps> = ({
image,
priority = false,
onLoad,
className = "",
isInteractive = false,
}) => {
const gateway =
process.env.NEXT_PUBLIC_PINATA_GATEWAY?.replace(/\/$/, "") ||
    "https://gateway.pinata.cloud/ipfs";
  const imageUrl = image.ipfsHash.startsWith("http")
    ? image.ipfsHash
    : `${gateway}/${image.ipfsHash}`;

if (process.env.NODE_ENV === "development") {
return (
<motion.div
className={`relative w-full h-full overflow-hidden ${
          isInteractive ? "cursor-pointer" : ""
        }`}
whileHover={
isInteractive
? {
scale: 1.05,
transition: { duration: 0.2 },
}
: undefined
} >
<DevImage
src={imageUrl}
alt={image.description || "Memory"}
className={`object-cover ${className}`}
fill
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
priority={priority}
quality={75}
onLoad={onLoad}
/>
</motion.div>
);
}

return (
<motion.div
className={`relative w-full h-full overflow-hidden ${
        isInteractive ? "cursor-pointer" : ""
      }`}
whileHover={
isInteractive
? {
scale: 1.05,
transition: { duration: 0.2 },
}
: undefined
} >
<Image
src={imageUrl}
alt={image.description || "Memory"}
className={`object-cover ${className}`}
fill
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
priority={priority}
quality={75}
onLoad={onLoad}
/>
</motion.div>
);
};

export default MemoryImage;

/** @type {import('next').NextConfig} \*/
const nextConfig = {
reactStrictMode: true,
swcMinify: true,
experimental: {
optimizeCss: true,
},
transpilePackages: [
"three",
"p5",
"pinata-web3",
"@pinata/sdk",
"react-use-keypress",
],
images: {
domains: ["gateway.pinata.cloud"],
remotePatterns: [
{
protocol: "https",
hostname: "gateway.pinata.cloud",
port: "",
pathname: "/ipfs/**",
},
],
minimumCacheTTL: 60,
dangerouslyAllowSVG: true,
unoptimized: process.env.NODE_ENV === "development",
},
env: {
PINATA_JWT: process.env.PINATA_JWT,
PINATA_GROUP_ID: process.env.PINATA_GROUP_ID,
},
compiler: {
removeConsole: process.env.NODE_ENV === "production",
},
webpack: (config, { isServer }) => {
if (!isServer) {
config.resolve.fallback = {
...config.resolve.fallback,
fs: false,
net: false,
tls: false,
};
}

    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;

},
typescript: {
ignoreBuildErrors: true,
},
};

module.exports = nextConfig;
