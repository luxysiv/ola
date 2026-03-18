const PROXY_PREFIX = '/proxy-stream';

// ===== Lifecycle =====
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

// ===== Fetch Event =====
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith(PROXY_PREFIX)) {
    event.respondWith(handleRequest(event));
  }
});

// ===== Helper: Mã hóa / Giải mã URL =====
// Dùng btoa (Base64) để "giấu" URL gốc như yêu cầu ban đầu của bạn
function maskUrl(url) {
  try {
    return btoa(encodeURIComponent(url));
  } catch (e) {
    return url;
  }
}

function unmaskUrl(str) {
  try {
    return decodeURIComponent(atob(str));
  } catch {
    return null;
  }
}

// ===== Handler chính =====
async function handleRequest(event) {
  const url = new URL(event.request.url);
  const encoded = url.pathname.replace(PROXY_PREFIX + '/', '');

  if (!encoded) return new Response("Bad request", { status: 400 });

  const targetUrl = unmaskUrl(encoded);
  if (!targetUrl) return new Response("Invalid URL", { status: 400 });

  try {
    const res = await fetch(targetUrl, {
      headers: event.request.headers
    });

    if (!res.ok) return res;

    const contentType = res.headers.get("content-type") || "";
    const isM3U8 = contentType.includes("application/vnd.apple.mpegurl") || targetUrl.endsWith(".m3u8");

    if (isM3U8) {
      const text = await res.text();
      // Xử lý sạch Ads và Rewrite URL trong cùng 1 lần duyệt để tối ưu hiệu suất
      const processedManifest = processManifest(text, targetUrl);

      return new Response(processedManifest, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store"
        }
      });
    }

    // Với segment/key/file khác: Trả về trực tiếp stream từ fetch ban đầu
    return new Response(res.body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response("Fetch error: " + err.message, { status: 500 });
  }
}

/**
 * Xử lý M3U8: Chặn Ads + Rewrite URL + Clean path
 * Quy trình: Duyệt từng dòng -> Check Ads -> Rewrite URL -> Clean v7
 */
function processManifest(manifest, baseUrl) {
  const lines = manifest.split(/\r?\n/);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. LOGIC CHẶN ADS (Dựa trên Discontinuity)
    if (line === "#EXT-X-DISCONTINUITY") {
      let j = i + 1;
      let segmentsCount = 0;
      let hasKeyNone = false;
      let tempBuffer = [line]; // Giữ lại dòng Discontinuity hiện tại phòng trường hợp không phải Ads

      while (j < lines.length) {
        const nextLine = lines[j].trim();
        tempBuffer.push(lines[j]);

        if (nextLine.startsWith("#EXTINF:")) segmentsCount++;
        if (nextLine.includes("#EXT-X-KEY:METHOD=NONE")) hasKeyNone = true;
        
        // Nếu gặp Discontinuity tiếp theo, kết thúc cụm cần check
        if (nextLine === "#EXT-X-DISCONTINUITY") break;
        j++;
      }

      // Nếu khớp điều kiện Ads của bạn -> Nhảy cóc qua cụm này
      if (hasKeyNone || (segmentsCount >= 5 && segmentsCount <= 20)) {
        i = j; // Bỏ qua hoàn toàn đoạn từ i đến j
        continue;
      }
    }

    // 2. LOGIC REWRITE URL
    let processedLine = lines[i];

    // Xử lý dòng chứa thuộc tính URI (Key, Map)
    if (line.includes('URI="')) {
      processedLine = line.replace(/URI="([^"]+)"/g, (match, uri) => {
        const abs = new URL(uri, baseUrl).toString();
        return `URI="${PROXY_PREFIX}/${maskUrl(abs)}"`;
      });
    } 
    // Xử lý Master Playlist (Stream con)
    else if (line.startsWith("#EXT-X-STREAM-INF")) {
        // Dòng tiếp theo của STREAM-INF thường là link m3u8 con
        result.push(processedLine);
        i++;
        if (i < lines.length) {
            const subUrl = lines[i].trim();
            const absSub = new URL(subUrl, baseUrl).toString();
            result.push(`${PROXY_PREFIX}/${maskUrl(absSub)}`);
        }
        continue;
    }
    // Xử lý URL Segment thường
    else if (!line.startsWith("#")) {
      try {
        const abs = new URL(line, baseUrl).toString();
        processedLine = `${PROXY_PREFIX}/${maskUrl(abs)}`;
      } catch (e) {
        processedLine = line;
      }
    }

    // 3. CLEAN PATH & PUSH
    // Thực hiện replace /convertv7/ trên từng dòng trước khi đẩy vào kết quả
    result.push(processedLine.replace(/\/convertv7\//g, "/"));
  }

  return result.join("\n");
}
