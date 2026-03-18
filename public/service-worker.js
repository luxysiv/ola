const PROXY_PREFIX = '/proxy-stream';

// ===== Lifecycle =====
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// ===== Fetch interceptor =====
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith(PROXY_PREFIX)) {
    event.respondWith(handleVirtualRequest(event));
  }
});

// ===== Decode URL (unmask) =====
function unmaskUrl(encoded) {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return null;
  }
}

// ===== Encode URL (mask) =====
function maskUrl(url) {
  return btoa(encodeURIComponent(url));
}

// ===== Handle request =====
async function handleVirtualRequest(event) {
  const url = new URL(event.request.url);

  // lấy phần encoded sau /proxy-stream/
  const encoded = url.pathname.replace(PROXY_PREFIX + '/', '');

  if (!encoded) {
    return new Response("Missing encoded URL", { status: 400 });
  }

  const playlistUrl = unmaskUrl(encoded);

  if (!playlistUrl) {
    return new Response("Invalid encoded URL", { status: 400 });
  }

  try {
    const manifest = await fetchAndProcessPlaylist(playlistUrl);

    return new Response(manifest, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

// ===== Fetch & process m3u8 =====
async function fetchAndProcessPlaylist(playlistUrl) {
  const res = await fetch(playlistUrl);

  if (!res.ok) throw new Error("Cannot fetch playlist");

  let text = await res.text();

  // ===== Convert tất cả line URL -> absolute + mask =====
  text = text.replace(/^[^#].*$/gm, (line) => {
    try {
      const abs = new URL(line.trim(), playlistUrl).toString();
      return `${PROXY_PREFIX}/${maskUrl(abs)}`;
    } catch {
      return line;
    }
  });

  // ===== Nếu là master playlist → lấy sub playlist =====
  if (text.includes("#EXT-X-STREAM-INF")) {
    const lines = text.split("\n");

    for (let i = 1; i < lines.length; i++) {
      if (lines[i - 1].includes("#EXT-X-STREAM-INF")) {
        const subEncoded = lines[i].replace(PROXY_PREFIX + '/', '').trim();
        const subUrl = unmaskUrl(subEncoded);

        if (subUrl) {
          return fetchAndProcessPlaylist(subUrl);
        }
      }
    }
  }

  return cleanManifest(text);
}

// ===== Clean manifest =====
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

    // Skip đoạn ads / junk
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
