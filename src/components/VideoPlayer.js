import React, { useRef, useEffect } from "react";
import videojs from "video.js";

import "video.js/dist/video-js.css";
import "@videojs/themes/dist/sea/index.css";

import "videojs-mobile-ui";
import "videojs-mobile-ui/dist/videojs-mobile-ui.css";
import "videojs-shuttle-controls";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const isSafari = () => {
  const ua = window.navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(ua);
};

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const hasResumed = useRef(false);

  useEffect(() => {
    hasResumed.current = false;
  }, [src]);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const videoElement = videoRef.current;
    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    // =============================
    // CLEANUP PLAYER
    // =============================
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.load();

    // =============================
    // INIT VIDEOJS
    // =============================
    const player = videojs(videoElement, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      preload: "auto",
      playsinline: true,
      inactivityTimeout: 3000, // auto hide giống Youtube
      controlBar: {
        volumePanel: { inline: false }
      },
      html5: {
        vhs: {
          overrideNative: !isSafari(),
          enableLowInitialPlaylist: true,
          smoothQualityChange: true
        },
        nativeAudioTracks: isSafari(),
        nativeVideoTracks: isSafari()
      },
      sources: [
        {
          src: proxiedUrl,
          type: "application/x-mpegURL"
        }
      ]
    });

    playerRef.current = player;

    // =============================
    // MOBILE UI (double tap seek)
    // =============================
    if (!isIOS()) {
      player.mobileUi({
        fullscreen: {
          enterOnRotate: true
        },
        touchControls: {
          seekSeconds: 10
        }
      });
    }

    // =============================
    // SHUTTLE CONTROLS
    // =============================
    player.ready(() => {
      player.shuttleControls({
        forward: 10,
        back: 10
      });
    });

    // =============================
    // RESUME TIME
    // =============================
    player.on("loadedmetadata", () => {
      if (movieInfo?.currentTime && !hasResumed.current) {
        player.currentTime(movieInfo.currentTime);
        hasResumed.current = true;
      }
    });

    // =============================
    // AUTO NEXT
    // =============================
    player.on("ended", () => {
      onVideoEnd && onVideoEnd();
    });

    // =============================
    // ERROR AUTO RETRY
    // =============================
    player.on("error", () => {
      console.log("Stream error → retrying...");
      setTimeout(() => {
        if (!player.isDisposed()) {
          player.src({
            src: proxiedUrl,
            type: "application/x-mpegURL"
          });
          player.play().catch(() => {});
        }
      }, 2000);
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }

      videoElement.pause();
      videoElement.removeAttribute("src");
      videoElement.load();
    };
  }, [src]);

  // =============================
  // SAVE HISTORY (5s)
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
            className="video-js vjs-theme-sea vjs-big-play-centered"
            playsInline
          />
        </div>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
