import ImageKit from "@imagekit/nodejs";

let _imagekit: ImageKit | undefined;

export function getImageKit(): ImageKit {
  if (!_imagekit) {
    const privateKey =
      process.env.IMAGE_KIT_API_KEY ?? process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error(
        "ImageKit env vars not set. Ensure IMAGE_KIT_API_KEY or IMAGEKIT_PRIVATE_KEY is configured.",
      );
    }

    _imagekit = new ImageKit({ privateKey });
  }
  return _imagekit;
}
