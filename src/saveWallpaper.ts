import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

import type { Wallpaper } from './api/nexwall';

/**
 * Downloads the full-resolution image to the cache directory and saves it
 * to the device photo library (Gallery / Photos).
 */
export async function saveWallpaper(wallpaper: Wallpaper): Promise<void> {
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error('Permission to save photos was denied.');
  }

  const extension = wallpaper.image_url.split('?')[0].match(/\.(jpe?g|png|webp)$/i)?.[1] ?? 'jpg';
  const destination = new File(Paths.cache, `nexwall-${wallpaper.id}.${extension}`);

  const file = await File.downloadFileAsync(wallpaper.image_url, destination, { idempotent: true });
  try {
    await Asset.create(file.uri);
  } finally {
    file.delete();
  }
}
