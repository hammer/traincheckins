# Tube Check-in

A mobile-first Progressive Web App for checking in when boarding London Underground trains.

## Features

- **Manual Check-in**: Enter the 5-digit leading car number displayed on the front of the train
- **Find Nearby Trains**: Select your line and station to see real-time train arrivals with their 5-digit IDs
- **Journey Tracking**: Track your journey duration with a live timer
- **Auto-detect Line**: The app can identify the line from the train number prefix

## Supported Lines

### Real-time Train Detection (TrackerNet)
These lines support the "Find Nearby Trains" feature:
- Victoria (11xxx)
- Jubilee (96xxx)
- Northern (51xxx)
- Central (91xxx)
- District (21xxx)

### Manual Check-in Only
All tube lines are supported for manual check-in, including Metropolitan, Hammersmith & City, Circle, Bakerloo, and Piccadilly.

## How It Works

The app uses TfL's TrackerNet API to fetch real-time train predictions, which include the 5-digit Leading Car Number (LCN) for trains on lines with modern signalling systems (TBTC - Transmission Based Train Control).

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Get a free TfL API key at https://api-portal.tfl.gov.uk/
   - Subscribe to the **TrackernetFeedPublic** product
4. Create a `.env` file based on `.env.example`:
   ```
   VITE_TFL_API_KEY=your_api_key_here
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- PWA (vite-plugin-pwa)
- TfL TrackerNet API

## License

MIT
