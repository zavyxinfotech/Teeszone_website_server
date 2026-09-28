import { z } from "zod";
import { envelope } from "../../utils/zod";

export const collectionEntity = z.object({
  slug: z.string(),
  name: z.string(),
  segment: z.string(),
  group: z.string(),
  description: z.string(),
});

export const segmentEntity = z.object({
  slug: z.string(),
  name: z.string(),
  groups: z.array(
    z.object({
      title: z.string(),
      collections: z.array(z.string()),
    }),
  ),
});

export const getNavigationSchema = {
  description:
    "Navigation payload: nav segments (ordered, with ordered groups/collection slugs) plus every collection. Feeds the mega menu, footer and sibling chips in one call.",
  tags: ["Catalog"],
  summary: "Get navigation",
  response: {
    200: envelope(
      z.object({
        segments: z.array(segmentEntity),
        collections: z.array(collectionEntity),
      }),
    ),
  },
};
