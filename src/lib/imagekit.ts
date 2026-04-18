import ImageKit from "@imagekit/nodejs";

let _imagekit: ImageKit | undefined;

export function getImageKit(): ImageKit {
  if (!_imagekit) {
    const apiKey = process.env.IMAGE_KIT_API_KEY;
    if (!apiKey) {
      throw new Error(
        "IMAGE_KIT_API_KEY environment variable is not set. Ensure .env.local or .env is configured with a valid ImageKit API key.",
      );
    }
    _imagekit = new ImageKit({ privateKey: apiKey });
  }
  return _imagekit;
}
