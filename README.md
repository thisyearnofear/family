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
