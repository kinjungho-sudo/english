import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.travelspeak.app',
  appName: 'TravelSpeak',
  webDir: 'out',
  // 프로덕션: Vercel 배포 URL 사용 (WebView로 로드)
  server: {
    url: 'https://english-rho-seven.vercel.app',
    cleartext: false,
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
  },
}

export default config
