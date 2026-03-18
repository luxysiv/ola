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
  if (contentType.includes("application/vnd.apple.mpegurl") || targetUrl.endsWith(".m3u8")) {
    const text = await res.text();
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

// ===== Rewrite m3u8 chuẩn =====
function rewriteM3U8(content, baseUrl) {
  const lines = content.split(/\r?\n/);

  return lines.map((line) => {
    const trimmed = line.trim();

    if (!trimmed) return line;

    // ===== URI trong tag (KEY, MAP, etc) =====
    if (trimmed.startsWith("#EXT-X-KEY") || trimmed.startsWith("#EXT-X-MAP")) {
      return line.replace(/URI="([^"]+)"/, (match, uri) => {
        const abs = new URL(uri, baseUrl).toString();
        return `URI="${PROXY_PREFIX}/${maskUrl(abs)}"`;
      });
    }

    // ===== Bỏ qua comment =====
    if (trimmed.startsWith("#")) return line;

    // ===== Đây là URL (segment hoặc playlist con) =====
    try {
      const abs = new URL(trimmed, baseUrl).toString();
      return `${PROXY_PREFIX}/${maskUrl(abs)}`;
    } catch {
      return line;
    }
  }).join("\n");
}
