function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  return /^(1|true|yes|on)$/i.test(value);
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminName: process.env.ADMIN_NAME ?? "LE BRIEF Admin",
  searchConsoleClientEmail: process.env.SEARCH_CONSOLE_CLIENT_EMAIL ?? "",
  searchConsolePrivateKey: process.env.SEARCH_CONSOLE_PRIVATE_KEY ?? "",
  searchConsolePrivateKeyId: process.env.SEARCH_CONSOLE_PRIVATE_KEY_ID ?? "",
  searchConsoleOauthClientId: process.env.SEARCH_CONSOLE_OAUTH_CLIENT_ID ?? "",
  searchConsoleOauthClientSecret: process.env.SEARCH_CONSOLE_OAUTH_CLIENT_SECRET ?? "",
  searchConsoleOauthRefreshToken: process.env.SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN ?? "",
  searchConsoleProperty: process.env.SEARCH_CONSOLE_PROPERTY ?? "https://www.lebrief.energy/",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  newsletterFromEmail: process.env.NEWSLETTER_FROM_EMAIL ?? "",
  newsletterAnchorRecipient: process.env.NEWSLETTER_ANCHOR_RECIPIENT ?? "",
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY ?? "",
  pexelsApiKey: process.env.PEXELS_API_KEY ?? "",
  googleCustomSearchApiKey: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY ?? "",
  googleCustomSearchCx: process.env.GOOGLE_CUSTOM_SEARCH_CX ?? "",
  autoPublishReuters: parseBooleanEnv(process.env.AUTO_PUBLISH_REUTERS, true),
  reutersEnergySourceUrl: process.env.REUTERS_ENERGY_SOURCE_URL ?? "https://www.reuters.com/business/energy/",
  cronSecret: process.env.CRON_SECRET ?? "",
};
