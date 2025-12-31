# Podcast Studio POC

An AI-powered application that transforms text into engaging podcasts and audiobooks. Generate single-narrator stories or dynamic two-host conversations using advanced AI speech synthesis.

![Podcast Studio Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Features

- **Text-to-Audio Generation**: Convert articles, notes, or any text into high-quality audio.
- **Dual Modes**: 
  - **Single Narrator**: Perfect for audiobooks and storytelling.
  - **Duo Conversation**: Simulates a lively podcast discussion between two hosts.
- **Multi-Language Support**: Supports Traditional Chinese and English.
- **Voice Customization**: Choose from different AI voices with distinct tones and styles.
- **Library Management**: auto-save your generated audio to a local library for listening anytime.
- **Script View**: Read along with the generated script while listening.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS (via CDN/Vanilla CSS), Unstyled UI components
- **AI Integration**: Google Gemini API (for script generation and text processing)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TheNickDeveloper/Podcast-Studio-POC.git
   cd Podcast-Studio-POC
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: The project currently looks for `GEMINI_API_KEY` in env vars)*

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for automatic deployment to GitHub Pages via GitHub Actions.

1. Push your changes to the `main` branch.
2. The GitHub Action will automatically build and deploy the application.
3. Access your deployed app at `https://[username].github.io/Podcast-Studio-POC/`.

## License

MIT
