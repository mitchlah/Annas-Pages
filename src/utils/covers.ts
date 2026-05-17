// Looks up a book cover via the Open Library search API.
export async function searchCover(
  title: string,
  author: string,
): Promise<string | null> {
  const t = title.trim();
  if (!t) return null;

  const params = new URLSearchParams({ title: t, limit: '1' });
  if (author.trim()) params.set('author', author.trim());

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?${params.toString()}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      docs?: { cover_i?: number }[];
    };
    const coverId = data.docs?.[0]?.cover_i;
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  } catch {
    return null;
  }
}

// Reads an uploaded image, downscales it so its longest edge is at most
// MAX_EDGE pixels, and returns a compressed JPEG data URL. This keeps cover
// images small enough to fit comfortably in localStorage.
const MAX_EDGE = 600;
const JPEG_QUALITY = 0.8;

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(
        1,
        MAX_EDGE / Math.max(img.width, img.height),
      );
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process the image.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load the selected image.'));
    };
    img.src = objectUrl;
  });
}
