# Memory Flow - Interactive Year-End Memory Experience

## Vision

Memory Flow is an interactive gift experience that lets you share your year's most meaningful moments with loved ones. It transforms your photos into an engaging story that celebrates connection, presented in either a serene Zen Garden or cosmic Space journey theme.

### Key Features

- **Private Gift Experiences**: Each gift experience is securely stored using Pinata's Files API
- **Interactive Timeline**: Navigate through memories with intuitive timeline controls
  - Auto-highlighting feature with pause/resume functionality
  - Smooth transitions between months and gallery view
  - Manual navigation with previous/next month controls
- **Monthly Collections**: Photos beautifully arranged in monthly collages with:
  - Automatic date organization
  - Smooth animations and transitions
  - Responsive grid layouts
- **Gallery View**: A stunning year-end collage that captures all moments
  - Accessible through timeline navigation
  - Grid layout optimized for viewing all photos
  - Disables auto-highlighting for manual browsing
- **Theme Options**: Choose between Space and Zen Garden themes, each with:
  - Unique animations and visual effects
  - Custom background elements
  - Theme-specific color schemes and transitions
- **Music Controls**:
  - Play/pause background music
  - Volume control
  - Track selection with previous/next controls
- **Upload Progress**:
  - Detailed status messages for each stage
  - Clear progress indicators
  - User-friendly notifications

## Technical Implementation

- Built with [Next.js](https://nextjs.org/) for seamless user experience
- Styled with [Tailwind CSS](https://tailwindcss.com/) for beautiful, responsive design
- Uses [Framer Motion](https://www.framer.com/motion/) for smooth animations
- Features [Three.js](https://threejs.org/) for immersive 3D backgrounds
- Implements React hooks for efficient state management
- Uses memoization for optimized performance

## Storage Architecture

### Private Content (User Gifts)

- Uses Pinata's Files API for secure, private storage
- Each gift has a unique identifier
- Content includes:
  - Photos with metadata (date taken, description)
  - Theme configuration
  - Gift metadata

### Demo Content

- Pre-configured demo gifts for each theme
- Accessible through environment variables
- Showcases full functionality without user upload

## Gift Creation Flow

1. **Theme Selection**

   - Choose between Space and Zen Garden themes
   - Preview theme-specific animations

2. **Photo Upload**

   - Drag-and-drop interface
   - Automatic date extraction
   - Progress tracking with detailed status messages

3. **Gift Organization**

   - Automatic monthly grouping
   - Preview timeline functionality
   - Gallery view arrangement

4. **Gift Sharing**

   - Generate unique gift ID
   - Copy or download sharing link
   - Optional download of all content

5. **Gift Viewing**
   - Enter gift ID to unwrap
   - Interactive timeline navigation
   - Auto-highlighting with manual controls

## Project Structure

- `components/`: Reusable UI components
  - `timeline/`: Timeline and navigation components
  - `themes/`: Theme-specific components and effects
  - `ui/`: Common UI elements
- `contexts/`: React context providers
- `hooks/`: Custom React hooks
- `pages/`: Next.js pages and API routes
- `utils/`: Utility functions and types

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   PINATA_JWT=your_jwt_token
   NEXT_PUBLIC_PINATA_GATEWAY=your_gateway_url
   NEXT_PUBLIC_SPACE_DEMO_ID=your_space_demo_id
   NEXT_PUBLIC_JAPANESE_DEMO_ID=your_japanese_demo_id
   ```
   Note: The Pinata JWT is now served securely through an API endpoint and should not be exposed to the client.
4. Run the development server:
   ```bash
   npm run dev
   ```

## License

### Code

This project is licensed under the MIT License - see the LICENSE file for details.

### Media Content

All images and videos are licensed under [Creative Commons Attribution-NonCommercial-NoDerivs 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/).
