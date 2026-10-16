import { z } from "zod";

export const heroStatSchema = z.object({
  end: z.number().or(z.string()).transform((val) => Number(val) || 0),
  suffix: z.string().default(""),
  label: z.string(),
});

export const heroContentSchema = z.object({
  badge: z.string().default("Tiruppur · India's Knitwear Capital"),
  title: z.string().default("Factory-Direct\nCustom Apparel"),
  description: z.string().default(""),
  heroImage: z.string().default(""),
  bgImageDesktop: z.string().default(""),
  bgImageMobile: z.string().default(""),
  primaryBtnText: z.string().default("Shop the Range"),
  primaryBtnLink: z.string().default("/products"),
  secondaryBtnText: z.string().default("Bulk Enquiry"),
  secondaryBtnLink: z.string().default("/contact"),
  stats: z.array(heroStatSchema).default([]),
});

export const shopByRangeTileSchema = z.object({
  title: z.string(),
  href: z.string(),
  image: z.string(),
  buttonText: z.string().default("Shop now"),
  sale: z.boolean().default(false),
});

export const shopByRangeFeatureSchema = z.object({
  title: z.string(),
  text: z.string(),
  href: z.string(),
  buttonText: z.string().default("Shop Hoodies"),
  image: z.string(),
});

export const shopByRangeContentSchema = z.object({
  title: z.string().default("Shop by Range"),
  feature: shopByRangeFeatureSchema,
  tiles: z.array(shopByRangeTileSchema).default([]),
});

export const fabricLibraryContentSchema = z.object({
  title: z.string().default("The Fabric Library"),
  subtitle: z.string().default("Eight knits, each engineered for a job. Pick one to see what it does best."),
});

export const processStepSchema = z.object({
  title: z.string(),
  text: z.string(),
});

export const processStepsContentSchema = z.object({
  title: z.string().default("The TeesZone Process"),
  subtitle: z.string().default("From first message to delivered boxes in four steps."),
  steps: z.array(processStepSchema).default([]),
});

export const homeContentSchema = z.object({
  hero: heroContentSchema,
  shopByRange: shopByRangeContentSchema,
  fabricLibrary: fabricLibraryContentSchema,
  processSteps: processStepsContentSchema,
});

export const getHomeContentSchema = {
  tags: ["Home Content"],
  summary: "Get homepage content (Hero, Shop By Range, Fabric Library, Process Steps)",
};

export const updateHomeContentSchema = {
  tags: ["Home Content"],
  summary: "Update homepage content (Admin only)",
  body: homeContentSchema,
};
