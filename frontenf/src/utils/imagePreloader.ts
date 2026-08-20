/**
 * Preloads an array of base64 PNG data URLs into memory to ensure 60fps zero-lag slider updates.
 */
export async function preloadImages(imageUrls: string[]): Promise<HTMLImageElement[]> {
  const validUrls = imageUrls.filter((url) => url && url.trim().length > 0);
  const promises = validUrls.map((url) => {
    return new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img); // Avoid blocking on malformed image
      img.src = url;
    });
  });

  return Promise.all(promises);
}

/**
 * Preloads all slices and all heatmaps from a PredictResponse.
 */
export async function preloadAllStudyImages(
  slices: string[],
  heatmaps: Record<string, string[]>
): Promise<void> {
  const allUrls: string[] = [...slices];
  for (const list of Object.values(heatmaps)) {
    allUrls.push(...list);
  }
  await preloadImages(allUrls);
}
