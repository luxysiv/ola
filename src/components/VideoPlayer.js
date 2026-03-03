import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import "videojs-mobile-ui";
import "videojs-mobile-ui/dist/videojs-mobile-ui.css";

// Import và đăng ký plugin vtt-thumbnails đúng cách
import vttThumbnails from 'videojs-vtt-thumbnails';
import "videojs-vtt-thumbnails/dist/videojs-vtt-thumbnails.css";

// Đăng ký plugin với Video.js
vttThumbnails(videojs);

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

    // Cleanup old player
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.load();

    // Initialize Video.js
    const player = videojs(videoElement, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      preload: "auto",
      playsinline: true,
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

    // Mobile UI (Disable iOS native fullscreen conflict)
    if (!isIOS()) {
      player.ready(() => {
        if (player.mobileUi) {
          player.mobileUi({
            fullscreen: {
              enterOnRotate: true
            },
            touchControls: {
              seekSeconds: 10
            }
          });
        }
      });
    }

    // Shuttle Controls
    player.ready(() => {
      if (player.shuttleControls) {
        player.shuttleControls({
          forward: 10,
          back: 10
        });
      }
    });

    // Initialize Thumbnails - QUAN TRỌNG: Khởi tạo sau khi player ready
    player.ready(() => {
      // Kiểm tra plugin đã được đăng ký chưa
      console.log('Checking vttThumbnails plugin:', typeof player.vttThumbnails);
      
      if (typeof player.vttThumbnails === 'function') {
        try {
          player.vttThumbnails({
            src: "/thumbnails.vtt",
            debug: true, // Bật debug để xem lỗi
            crossOrigin: "anonymous",
            showTimestamp: true // Hiển thị thời gian
          });
          console.log('vttThumbnails initialized successfully');
        } catch (error) {
          console.error('Error initializing vttThumbnails:', error);
        }
      } else {
        console.error('vttThumbnails plugin not found. Available plugins:', Object.keys(player));
        
        // Thử đăng ký lại plugin nếu chưa có
        if (!videojs.getPlugin('vttThumbnails')) {
          console.log('Registering plugin again...');
          const vttThumbnailsPlugin = require('videojs-vtt-thumbnails');
          videojs.registerPlugin('vttThumbnails', vttThumbnailsPlugin);
          
          // Thử khởi tạo lại
          setTimeout(() => {
            if (typeof player.vttThumbnails === 'function') {
              player.vttThumbnails({
                src: "/thumbnails.vtt",
                debug: true
              });
            }
          }, 100);
        }
      }
    });

    // Resume time
    player.on("loadedmetadata", () => {
      if (movieInfo?.currentTime && !hasResumed.current) {
        player.currentTime(movieInfo.currentTime);
        hasResumed.current = true;
      }
    });

    // Auto next
    player.on("ended", () => {
      onVideoEnd && onVideoEnd();
    });

    // Auto hide controls
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

    // Error auto retry
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
      clearTimeout(hideTimeout);

      if (player && !player.isDisposed()) {
        player.dispose();
      }

      videoElement.pause();
      videoElement.removeAttribute("src");
      videoElement.load();
    };
  }, [src, movieInfo, onVideoEnd]);

  // Save history (5s)
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (player && !player.paused() && !player.isDisposed()) {
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
            playsInline
          />
        </div>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
