const PROXY_PREFIX = '/proxy-stream';

// ===== Lifecycle =====
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// ===== Fetch =====
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith(PROXY_PREFIX)) {
    event.respondWith(handleRequest(event));
  }
});

// ===== Mask / Unmask =====
function maskUrl(url) {
  return btoa(encodeURIComponent(url));
}

function unmaskUrl(str) {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return null;
  }
}

// ===== Main handler =====
async function handleRequest(event) {
  const url = new URL(event.request.url);
  const encoded = url.pathname.replace(PROXY_PREFIX + '/', '');

  if (!encoded) return new Response("Bad request", { status: 400 });

  const targetUrl = unmaskUrl(encoded);
  if (!targetUrl) return new Response("Invalid URL", { status: 400 });

  const res = await fetch(targetUrl, {
    headers: event.request.headers
  });

  if (!res.ok) return res;

  const contentType = res.headers.get("content-type") || "";

  // ===== Nếu là m3u8 =====
  if (
    contentType.includes("application/vnd.apple.mpegurl") ||
    targetUrl.endsWith(".m3u8")
  ) {
    let text = await res.text();

    // 🔥 CHẶN ADS (giữ nguyên logic bạn đang dùng)
    text = cleanManifest(text);

    // 🔁 Rewrite sau khi clean
    const rewritten = rewriteM3U8(text, targetUrl);

    return new Response(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store"
      }
    });
  }

  // ===== Nếu là segment/key/file khác =====
  return new Response(res.body, {
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  });
}

// ===== Clean Manifest (ADS BLOCK - version gốc của bạn) =====
function cleanManifest(manifest) {
  const lines = manifest.split(/\r?\n/);
  const result = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line !== "#EXT-X-DISCONTINUITY") {
      result.push(lines[i]);
      i++;
      continue;
    }

    const start = i;
    let j = i + 1;
    let segments = 0;
    let hasKeyNone = false;

    while (j < lines.length) {
      const l = lines[j].trim();

      if (l.startsWith("#EXTINF:")) segments++;

      if (l.includes("#EXT-X-KEY:METHOD=NONE"))
        hasKeyNone = true;

      if (l === "#EXT-X-DISCONTINUITY") break;

      j++;
    }

    if (j >= lines.length) {
      result.push(lines[i]);
      i++;
      continue;
    }

    // 🔥 RULE chặn ads (giữ nguyên logic bạn đang dùng)
    if (hasKeyNone || (segments >= 5 && segments <= 20)) {
      i = j + 1;
      continue;
    }

    for (let k = start; k <= j; k++) {
      result.push(lines[k]);
    }

    i = j + 1;
  }

  return result
    .join("\n")
    .replace(/\/convertv7\//g, "/")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

// ===== Rewrite m3u8 =====
function rewriteM3U8(content, baseUrl) {
  const lines = content.split(/\r?\n/);

  return lines.map((line) => {
    const trimmed = line.trim();

    if (!trimmed) return line;

    // KEY / MAP
    if (
      trimmed.startsWith("#EXT-X-KEY") ||
      trimmed.startsWith("#EXT-X-MAP")
    ) {
      return line.replace(/URI="([^"]+)"/, (match, uri) => {
        const abs = new URL(uri, baseUrl).toString();
        return `URI="${PROXY_PREFIX}/${maskUrl(abs)}"`;
      });
    }

    // comment
    if (trimmed.startsWith("#")) return line;

    // URL
    try {
      const abs = new URL(trimmed, baseUrl).toString();
      return `${PROXY_PREFIX}/${maskUrl(abs)}`;
    } catch {
      return line;
    }
  }).join("\n");
}
