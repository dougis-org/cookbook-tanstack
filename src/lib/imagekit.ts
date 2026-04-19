import ImageKit from "@imagekit/nodejs";

let _imagekit: ImageKit | undefined;

export function getImageKit(): ImageKit {
  if (!_imagekit) {
    const privateKey = process.env.IMAGE_KIT_API_KEY;
    const publicKey = process.env.IMAGE_KIT_PUBLIC_KEY;
    const urlEndpoint = process.env.IMAGE_KIT_URL_ENDPOINT;
    if (!privateKey || !publicKey || !urlEndpoint) {
      throw new Error(
        "ImageKit env vars not set. Ensure IMAGE_KIT_API_KEY, IMAGE_KIT_PUBLIC_KEY, and IMAGE_KIT_URL_ENDPOINT are configured.",
      );
    }
    _imagekit = new ImageKit({ privateKey });
  }
  return _imagekit;
}
