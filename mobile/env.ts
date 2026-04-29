import { Platform } from 'react-native';

export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3003/api',
  APP_NAME: 'PoolOps Mobile',
  APP_VERSION: '1.0.0',
  IS_IOS: Platform.OS === 'ios',
  IS_ANDROID: Platform.OS === 'android',
  IS_WEB: Platform.OS === 'web',
};
