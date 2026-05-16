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

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
