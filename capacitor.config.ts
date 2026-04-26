import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blueechostudios.golf',
  appName: 'PinPlaced',
  webDir: 'public',
  server: {
    url: 'https://pinplaced.com',
    cleartext: true
  }
};

export default config;
