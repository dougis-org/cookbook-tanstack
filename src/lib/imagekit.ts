import ImageKit from "@imagekit/nodejs";

const imageKitApiKey = process.env.IMAGE_KIT_API_KEY;

if (!imageKitApiKey) {
  throw new Error(
    "IMAGE_KIT_API_KEY environment variable is not set. Ensure .env.local or .env is configured with a valid ImageKit API key.",
  );
}

export const imagekit = new ImageKit({
  privateKey: imageKitApiKey,
});
