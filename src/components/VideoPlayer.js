import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

import "videojs-mobile-ui";
import "videojs-mobile-ui/dist/videojs-mobile-ui.css";
import "videojs-shuttle-controls";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const hasResumed = useRef(false);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: true,
      preload: "auto",
      playsinline: true,
      aspectRatio: "16:9",
      controlBar: {
        volumePanel: { inline: false }
      },
      sources: [
        {
          src: proxiedUrl,
          type: "application/x-mpegURL"
        }
      ]
    });

    playerRef.current = player;

    // Mobile UI
    player.mobileUi({
      touchControls: {
        seekSeconds: 10
      }
    });

    // Shuttle
    player.ready(() => {
      player.shuttleControls({
        forward: 10,
        back: 10
      });
    });

    // Resume
    player.on("loadedmetadata", () => {
      if (movieInfo?.currentTime && !hasResumed.current) {
        player.currentTime(movieInfo.currentTime);
        hasResumed.current = true;
      }
    });

    player.on("ended", () => {
      onVideoEnd && onVideoEnd();
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
      }
    };
  }, [src]);

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
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white" }}>
      {/* Inject style trực tiếp */}
      <style>
        {`
          .vjs-youtube-style .vjs-control-bar {
            background: linear-gradient(
              to top,
              rgba(0,0,0,0.8),
              rgba(0,0,0,0)
            );
          }

          .vjs-youtube-style .vjs-big-play-button {
            border-radius: 50%;
            background-color: rgba(0,0,0,0.6);
            border: none;
            width: 80px;
            height: 80px;
            line-height: 80px;
            font-size: 40px;
          }

          .vjs-youtube-style .vjs-play-progress {
            background-color: #ff0000;
          }

          .vjs-youtube-style .vjs-volume-level {
            background-color: #ff0000;
          }

          .vjs-youtube-style .vjs-control-bar .vjs-control:hover {
            color: #ff0000;
          }
        `}
      </style>

      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ maxWidth: 960, margin: "0 auto" }}>
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered vjs-youtube-style"
          />
        </div>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
