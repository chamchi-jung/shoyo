export function parseYouTubeVideoId(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") ?? "";
      }

      const parts = url.pathname.split("/").filter(Boolean);

      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        return parts[1] ?? "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

export function isLikelyYouTubeVideoId(value: string) {
  return /^[a-zA-Z0-9_-]{6,}$/.test(value);
}
