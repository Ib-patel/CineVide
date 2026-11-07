export default async function globalSetup() {
  process.env.COOKIE_SECURE = "false";
  process.env.PLAYBACK_TOKEN_SECRET = "test-playback-secret-1234567890123456";
}
