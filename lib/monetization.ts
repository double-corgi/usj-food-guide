export const monetizationConfig = {
  adsEnabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  affiliateEnabled: false,
  sponsoredEnabled: false,
  labels: {
    ad: "広告",
    affiliate: "アフィリエイトリンク",
    sponsored: "PR"
  }
} as const;
