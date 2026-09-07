// @supabase/realtime-js checks for a global WebSocket constructor at
// createClient() time (even though tests never actually open a socket) —
// this repo's Node version predates Node's native WebSocket, so without a
// stub, importing src/lib/supabase.ts throws in every test that touches it.
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class WebSocket {};
}

// I18nProvider's default locale comes from the device via expo-localization.
// Pin it to English explicitly rather than relying on whatever jest-expo's
// native-module mock happens to resolve to — component tests that assert on
// translated text need this to be stable across environments and versions.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US', regionCode: 'US' }],
}));
