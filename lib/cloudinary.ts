import { createHash, randomUUID } from 'node:crypto';

export type ImagePurpose = 'avatar' | 'property';

export function createCloudinaryUploadSignature(userId: string, purpose: ImagePurpose) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary image storage is not configured.');
  }

  const params = {
    allowed_formats: 'jpg,png,webp',
    folder: `nestliving/${purpose}/${userId}`,
    overwrite: 'false',
    public_id: randomUUID(),
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
  const signatureBase = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const signature = createHash('sha1').update(`${signatureBase}${apiSecret}`).digest('hex');

  return { cloudName, apiKey, params, signature };
}

export function areOwnedCloudinaryImages(
  imageUrls: string[],
  userId: string,
  purpose: ImagePurpose
): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;

  return imageUrls.every((imageUrl) => {
    try {
      const url = new URL(imageUrl);
      return (
        url.protocol === 'https:' &&
        url.hostname === 'res.cloudinary.com' &&
        url.pathname.startsWith(`/${cloudName}/image/upload/`) &&
        url.pathname.includes(`/nestliving/${purpose}/${userId}/`)
      );
    } catch {
      return false;
    }
  });
}