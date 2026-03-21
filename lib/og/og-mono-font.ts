/** JetBrains Mono 700 WOFF — Satori rejects Geist’s WOFF tables; this is close to the app monospace vibe. */
const JB_MONO_BOLD_WOFF =
  "https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.2.5/files/jetbrains-mono-latin-700-normal.woff";

let cache: ArrayBuffer | null = null;

export async function loadOgMonoFont(): Promise<ArrayBuffer> {
  if (cache) return cache;
  const res = await fetch(JB_MONO_BOLD_WOFF);
  if (!res.ok) {
    throw new Error(`Failed to load OG monospace font: ${res.status}`);
  }
  cache = await res.arrayBuffer();
  return cache;
}
