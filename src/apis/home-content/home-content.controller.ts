import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { cacheGet, cacheInvalidate, cacheSet } from "../../services/cache.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

export const defaultHomeContent = {
  hero: {
    badge: "Tiruppur · India's Knitwear Capital",
    title: "Factory-Direct\nCustom Apparel",
    description:
      "Tees, polos, hoodies and uniforms — cut, stitched, printed and quality-checked under one roof, then delivered anywhere in India with your branding on every piece.",
    heroImage: "",
    bgImageDesktop: "",
    bgImageMobile: "",
    primaryBtnText: "Shop the Range",
    primaryBtnLink: "/products",
    secondaryBtnText: "Bulk Enquiry",
    secondaryBtnLink: "/contact",
    stats: [
      { end: 100, suffix: "%", label: "In-House Production" },
      { end: 6, suffix: "", label: "QC Checks Per Piece" },
      { end: 25, suffix: "+", label: "Product Lines" },
    ],
  },
  shopByRange: {
    title: "Shop by Range",
    feature: {
      title: "Hoodies Essentials",
      text: "Premium zip and non-zip hoodies — warm, durable and retail-grade.",
      href: "/collections/unisex-hoodie-zip-325",
      buttonText: "Shop Hoodies",
      image: "/products/crew-white.svg",
    },
    tiles: [
      { title: "Men", href: "/collections/mens-rn-half-180", image: "http://localhost:4010/api/upload/media/teeszone/dropdown/mens_dropdown_img.webp", buttonText: "Shop now", sale: false },
      { title: "Women", href: "/collections/womens-rn-half-180", image: "http://localhost:4010/api/upload/media/teeszone/dropdown/womens_dropdown_img.webp", buttonText: "Shop now", sale: false },
      { title: "Kids", href: "/collections/kids-rn-half-180", image: "http://localhost:4010/api/upload/media/teeszone/dropdown/kids_dropdown_img.webp", buttonText: "Shop now", sale: false },
      { title: "Mega Sale", href: "/collections/mega-sale", image: "/products/tee-yellow.svg", buttonText: "Shop now", sale: true },
    ],
  },
  fabricLibrary: {
    title: "The Fabric Library",
    subtitle: "Eight knits, each engineered for a job. Pick one to see what it does best.",
  },
  processSteps: {
    title: "The TeesZone Process",
    subtitle: "From first message to delivered boxes in four steps.",
    steps: [
      {
        title: "Share Your Requirement",
        text: "Product, quantity, size split and your logo — on WhatsApp, the cart, or the enquiry form.",
      },
      {
        title: "Approve the Mockup",
        text: "We send a digital mockup and fabric options. Nothing goes to production before you sign off.",
      },
      {
        title: "We Produce & QC",
        text: "Cut, stitch, print and a six-point check on every piece in our Tiruppur facility.",
      },
      {
        title: "Doorstep Delivery",
        text: "Packed, dispatched and tracked to your office, school or venue — anywhere in India.",
      },
    ],
  },
};

class HomeContentController {
  get = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const cached = await cacheGet<typeof defaultHomeContent>("home-content");
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = await (client as any).homeContent.findUnique({
        where: { id: "homepage" },
      });

      if (!row) {
        return reply.status(200).send(fmt.formatResponse(defaultHomeContent));
      }

      const data = {
        hero: { ...defaultHomeContent.hero, ...(row.hero || {}) },
        shopByRange: {
          ...defaultHomeContent.shopByRange,
          ...(row.shopByRange || {}),
          feature: {
            ...defaultHomeContent.shopByRange.feature,
            ...(row.shopByRange?.feature || {}),
          },
          tiles: row.shopByRange?.tiles || defaultHomeContent.shopByRange.tiles,
        },
        fabricLibrary: { ...defaultHomeContent.fabricLibrary, ...(row.fabricLibrary || {}) },
        processSteps: {
          ...defaultHomeContent.processSteps,
          ...(row.processSteps || {}),
          steps: row.processSteps?.steps || defaultHomeContent.processSteps.steps,
        },
      };

      await cacheSet("home-content", data);
      reply.status(200).send(fmt.formatResponse(data));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  update = async (req: FastifyRequest<{ Body: typeof defaultHomeContent }>, reply: FastifyReply) => {
    try {
      const body = req.body;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (client as any).homeContent.upsert({
        where: { id: "homepage" },
        update: {
          hero: body.hero,
          shopByRange: body.shopByRange,
          fabricLibrary: body.fabricLibrary,
          processSteps: body.processSteps,
        },
        create: {
          id: "homepage",
          hero: body.hero,
          shopByRange: body.shopByRange,
          fabricLibrary: body.fabricLibrary,
          processSteps: body.processSteps,
        },
      });

      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse(updated, "Home content updated successfully"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new HomeContentController();
