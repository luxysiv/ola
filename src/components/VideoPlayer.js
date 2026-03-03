import React, { useRef, useEffect, useCallback } from "react";
import videojs from "video.js";

// Styles
import "video.js/dist/video-js.css";
import "@videojs/themes/dist/city/index.css";
import "videojs-mobile-ui/dist/videojs-mobile-ui.css";

// Plugins
import "videojs-mobile-ui";
import "videojs-shuttle-controls";

import { Card, Box, Typography, GlobalStyles } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

// Helper kiểm tra thiết bị
const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  // 1. Hàm khởi tạo Player
  const initPlayer = useCallback(() => {
    if (!videoRef.current || !src) return;

    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    // Cấu hình Video.js
    const videoOptions = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      preload: "auto",
      playsinline: true,
      userActions: { hotkeys: true },
      controlBar: {
        children: [
          "playToggle",
          "volumePanel",
          "currentTimeDisplay",
          "timeDivider",
          "durationDisplay",
          "progressControl",
          "liveDisplay",
          "remainingTimeDisplay",
          "playbackRateMenuButton",
          "subsCapsButton",
          "audioTrackButton",
          "fullscreenToggle",
        ],
      },
      html5: {
        vhs: {
          overrideNative: !isSafari(),
          enableLowInitialPlaylist: true,
          fastQualityChange: true,
        },
        nativeAudioTracks: isSafari(),
        nativeVideoTracks: isSafari(),
      },
    };

    const player = videojs(videoRef.current, videoOptions, () => {
      // Player Ready
      player.src({ src: proxiedUrl, type: "application/x-mpegURL" });
      
      // Plugins
      if (!isIOS()) {
        player.mobileUi({ fullscreen: { enterOnRotate: true }, touchControls: { seekSeconds: 10 } });
      }
      player.shuttleControls({ forward: 10, back: 10 });
    });

    // Xử lý Resume Time (Chỉ chạy 1 lần khi load xong metadata)
    player.one("loadedmetadata", () => {
      if (movieInfo?.currentTime > 0) {
        player.currentTime(movieInfo.currentTime);
      }
      retryCount.current = 0; // Reset retry khi đã load thành công
    });

    player.on("ended", () => onVideoEnd?.());

    // 2. Hệ thống Tự động sửa lỗi (Auto Recovery)
    player.on("error", () => {
      const error = player.error();
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        console.warn(`Video Error: Tự động thử lại lần ${retryCount.current}/${MAX_RETRIES}...`);
        setTimeout(() => {
          player.src({ src: proxiedUrl, type: "application/x-mpegURL" });
          player.load();
          player.play().catch(() => {});
        }, 3000);
      }
    });

    playerRef.current = player;
  }, [src, onVideoEnd]); // Chỉ tạo lại khi src hoặc callback kết thúc đổi

  // Effect: Khởi tạo và Dọn dẹp
  useEffect(() => {
    initPlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [initPlayer]);

  // 3. Tối ưu việc lưu lịch sử (Chỉ lưu khi thực sự đang xem)
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && !player.paused() && !player.ended()) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: player.currentTime(),
        });
      }
    }, 10000); // 10 giây lưu 1 lần để giảm tải cho localStorage

    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", overflow: "hidden", border: "none", boxShadow: 0 }}>
      {/* CSS Global để triệt tiêu khung trắng focus */}
      <GlobalStyles styles={{
        ".video-js:focus, .vjs-tech:focus, .vjs-playing:focus": { outline: "none !important", boxShadow: "none !important" },
        ".vjs-error-display": { backgroundColor: "rgba(0,0,0,0.8) !important" }
      }} />

      {title && (
        <Box sx={{ p: 1.5, bgcolor: "#1a1a1a" }}>
          <Typography variant="subtitle1" noWrap>{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", position: "relative", bgcolor: "black", "&:focus": { outline: "none" } }}>
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js vjs-theme-city vjs-big-play-centered"
            playsInline
          />
        </div>
      </Box>
    </Card>
  );
};

export default React.memo(VideoPlayer);
