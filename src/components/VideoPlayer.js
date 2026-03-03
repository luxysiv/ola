import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import "videojs-mobile-ui";
import "videojs-mobile-ui/dist/videojs-mobile-ui.css";

import "videojs-vtt-thumbnails";
import "videojs-shuttle-controls";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const hasResumed = useRef(false);

  // Reset resume flag khi đổi video
  useEffect(() => {
    hasResumed.current = false;
  }, [src]);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    // Dispose player cũ nếu có
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      preload: "auto",
      sources: [
        {
          src: proxiedUrl,
          type: "application/x-mpegURL"
        }
      ]
    });

    playerRef.current = player;

    // =============================
    // ✅ MOBILE DOUBLE TAP
    // =============================
    player.mobileUi({
      fullscreen: {
        enterOnRotate: true
      },
      touchControls: {
        seekSeconds: 10,
        tapTimeout: 300
      }
    });

    // =============================
    // ✅ SHUTTLE CONTROLS (±10s)
    // =============================
    player.ready(() => {
      player.shuttleControls({
        forward: 10,
        back: 10
      });
    });

    // =============================
    // ✅ THUMBNAIL PREVIEW
    // =============================
    player.ready(() => {
      player.vttThumbnails({
        src: "/thumbnails.vtt"
      });
    });

    // =============================
    // ✅ VIDEO ENDED
    // =============================
    player.on("ended", () => {
      onVideoEnd && onVideoEnd();
    });

    // =============================
    // ✅ RESUME TIME
    // =============================
    player.on("loadedmetadata", () => {
      if (movieInfo?.currentTime && !hasResumed.current) {
        player.currentTime(movieInfo.currentTime);
        hasResumed.current = true;
      }
    });

    // =============================
    // ✅ AUTO HIDE CONTROLS (3s)
    // =============================
    let hideTimeout;

    const showControls = () => {
      if (!player || player.isDisposed()) return;

      player.controlBar.removeClass("vjs-hidden");

      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (!player.paused()) {
          player.controlBar.addClass("vjs-hidden");
        }
      }, 3000);
    };

    player.on("mousemove", showControls);
    player.on("touchstart", showControls);
    player.on("play", showControls);

    return () => {
      clearTimeout(hideTimeout);
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [src]);

  // =============================
  // ✅ SAVE HISTORY MỖI 5s
  // =============================
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && !player.paused()) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: player.currentTime(),
          updatedAt: Date.now()
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          bgcolor: "black"
        }}
      >
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered"
          />
        </div>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
