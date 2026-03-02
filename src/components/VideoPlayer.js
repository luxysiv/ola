import React, { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-vtt-thumbnails";
import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DOUBLE_DELAY = 300;
const RESET_DELAY = 1000;

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return "00:00";
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
};

const SeekIcon = ({ direction }) => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="white">
    {direction === "backward" ? (
      <path d="M11 18V6l-8.5 6L11 18zm1 0V6l8.5 6L12 18z" />
    ) : (
      <path d="M13 6v12l8.5-6L13 6zm-1 0v12L3.5 12 12 6z" />
    )}
  </svg>
);

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const hasResumed = useRef(false);
  const [overlay, setOverlay] = useState(null);

  useEffect(() => {
    hasResumed.current = false;
  }, [src]);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    if (playerRef.current) {
      playerRef.current.dispose();
    }

    const player = videojs(videoRef.current, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      sources: [
        {
          src: proxiedUrl,
          type: "application/x-mpegURL"
        }
      ]
    });

    playerRef.current = player;

    // Thumbnail preview
    player.ready(() => {
      player.vttThumbnails({
        src: "/thumbnails.vtt"
      });
    });

    player.on("ended", () => {
      onVideoEnd && onVideoEnd();
    });

    player.on("loadedmetadata", () => {
      if (movieInfo?.currentTime && !hasResumed.current) {
        player.currentTime(movieInfo.currentTime);
        hasResumed.current = true;
      }
    });

    // AUTO HIDE CONTROLS
    let hideTimeout;
    const showControls = () => {
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

    // DOUBLE CLICK SEEK
    const container = player.el();

    let lastTapTime = 0;
    let tapSide = null;
    let tapCount = 0;
    let singleTapTimeout = null;
    let resetTimeout = null;

    const showOverlay = (type, seconds, newTime) => {
      setOverlay({ type, seconds, newTime });
      setTimeout(() => setOverlay(null), 700);
    };

    const handleClick = (e) => {
      if (e.target.closest(".vjs-control-bar")) return;

      const now = Date.now();
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const side = x < rect.width / 2 ? "backward" : "forward";
      const isDouble = now - lastTapTime < DOUBLE_DELAY;

      if (isDouble && side === tapSide) {
        clearTimeout(singleTapTimeout);

        tapCount += 1;
        const totalSeek = tapCount * 10;

        const newTime =
          side === "backward"
            ? Math.max(0, player.currentTime() - 10)
            : Math.min(player.duration(), player.currentTime() + 10);

        player.currentTime(newTime);
        player.bigPlayButton.hide();

        showOverlay(side, totalSeek, newTime);

        clearTimeout(resetTimeout);
        resetTimeout = setTimeout(() => {
          tapCount = 0;
          tapSide = null;
        }, RESET_DELAY);
      } else {
        tapCount = 1;
        tapSide = side;

        singleTapTimeout = setTimeout(() => {
          const controlBar = player.controlBar;
          controlBar.hasClass("vjs-hidden")
            ? controlBar.removeClass("vjs-hidden")
            : controlBar.addClass("vjs-hidden");
        }, DOUBLE_DELAY);
      }

      lastTapTime = now;
    };

    container.addEventListener("click", handleClick);

    return () => {
      container.removeEventListener("click", handleClick);
      player.dispose();
    };
  }, [src]);

  // SAVE HISTORY
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
          position: "relative",
          bgcolor: "black"
        }}
      >
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered"
          />
        </div>

        {overlay && (
          <>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backdropFilter: "blur(6px)",
                background: "rgba(0,0,0,0.25)",
                pointerEvents: "none",
                animation: `fadeBlur 0.7s ${EASING} forwards`,
                "@keyframes fadeBlur": {
                  "0%": { opacity: 0 },
                  "40%": { opacity: 1 },
                  "100%": { opacity: 0 }
                }
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: overlay.type === "backward" ? "25%" : "75%",
                transform: "translate(-50%, -50%)",
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                animation: `ripple 0.7s ${EASING} forwards`,
                pointerEvents: "none",
                "@keyframes ripple": {
                  "0%": {
                    transform: "translate(-50%, -50%) scale(0.4)",
                    opacity: 0
                  },
                  "50%": { opacity: 1 },
                  "100%": {
                    transform: "translate(-50%, -50%) scale(1.5)",
                    opacity: 0
                  }
                }
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: overlay.type === "backward" ? "25%" : "75%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "white",
                pointerEvents: "none",
                animation: `fadeScale 0.7s ${EASING} forwards`,
                "@keyframes fadeScale": {
                  "0%": {
                    opacity: 0,
                    transform: "translate(-50%, -50%) scale(0.7)"
                  },
                  "50%": {
                    opacity: 1,
                    transform: "translate(-50%, -50%) scale(1.2)"
                  },
                  "100%": {
                    opacity: 0,
                    transform: "translate(-50%, -50%) scale(1)"
                  }
                }
              }}
            >
              <SeekIcon direction={overlay.type} />
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {overlay.seconds}s
              </div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                {formatTime(overlay.newTime)}
              </div>
            </Box>
          </>
        )}
      </Box>
    </Card>
  );
};

export default VideoPlayer;
