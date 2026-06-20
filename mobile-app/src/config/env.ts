import { Platform } from 'react-native';

// Your computer's LAN IP address (find with ipconfig with ipconfig)
// For Android emulator, change this to 10.0.2.2
const DEV_API_HOST = Platform.OS === 'web' ? 'localhost' : '10.10.20.142';

const getApiUrl = () => {
  if (__DEV__) {
    return `http://${DEV_API_HOST}:3001`;
  }
  // Production URL - change to your server domain
  return `http://${DEV_API_HOST}:3001`;
};

export const API_URL = getApiUrl();
