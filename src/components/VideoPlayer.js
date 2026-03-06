import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);

  const holdTimer = useRef(null);
  const seekTimer = useRef(null);
  const stackSeek = useRef(0);

  const [seekOverlay, setSeekOverlay] = useState(null);
  const [speedOverlay, setSpeedOverlay] = useState(false);
  const [ripple, setRipple] = useState(null);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // save watch history
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const activePlayer = player.current;

      if (activePlayer && !activePlayer.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: Math.floor(activePlayer.currentTime),
          updatedAt: Date.now(),
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  // hold -> 2x speed
  const handlePointerDown = () => {
    clearTimeout(holdTimer.current);

    holdTimer.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
      }
    }, 250);
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);

    if (player.current) {
      player.current.playbackRate = 1;
    }

    setSpeedOverlay(false);
  };

  // double tap seek
  const seekVideo = (direction) => {
    if (!player.current) return;

    stackSeek.current += 10;

    if (direction === "forward") {
      player.current.currentTime += 10;
      setSeekOverlay(`+${stackSeek.current}s`);
      setRipple("right");
    } else {
      player.current.currentTime -= 10;
      setSeekOverlay(`-${stackSeek.current}s`);
      setRipple("left");
    }

    clearTimeout(seekTimer.current);

    seekTimer.current = setTimeout(() => {
      stackSeek.current = 0;
      setSeekOverlay(null);
      setRipple(null);
    }, 700);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          crossOrigin
          load="eager"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onEnded={onVideoEnd}
          onCanPlay={() => {
            if (movieInfo?.currentTime > 0 && player.current) {
              player.current.currentTime = movieInfo.currentTime;
            }
          }}
        >
          <MediaProvider>
            {movieInfo?.thumb && (
              <Poster
                src={movieInfo.thumb}
                alt={movieInfo.name}
                className="vds-poster"
              />
            )}
          </MediaProvider>

          {/* tap zones */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              zIndex: 5,
            }}
          >
            {/* left */}
            <Box
              sx={{ width: "35%" }}
              onDoubleClick={() => seekVideo("back")}
            />

            {/* center */}
            <Box sx={{ width: "30%" }} />

            {/* right */}
            <Box
              sx={{ width: "35%" }}
              onDoubleClick={() => seekVideo("forward")}
            />
          </Box>

          {/* ripple animation */}
          {ripple && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                [ripple === "right" ? "right" : "left"]: "18%",
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                transform: "translateY(-50%)",
                animation: "ripple .6s ease",
                pointerEvents: "none",
              }}
            />
          )}

          {/* seek overlay */}
          {seekOverlay && (
            <Box
              sx={{
                position: "absolute",
                top: "45%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 34,
                fontWeight: "bold",
                background: "rgba(0,0,0,0.6)",
                padding: "12px 20px",
                borderRadius: 2,
                pointerEvents: "none",
                animation: "fadeSeek .6s",
              }}
            >
              {seekOverlay}
            </Box>
          )}

          {/* speed overlay */}
          {speedOverlay && (
            <Box
              sx={{
                position: "absolute",
                top: "45%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 36,
                fontWeight: "bold",
                background: "rgba(0,0,0,0.6)",
                padding: "12px 20px",
                borderRadius: 2,
                pointerEvents: "none",
              }}
            >
              ⚡2×
            </Box>
          )}

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        @keyframes fadeSeek {
          0% {opacity:0; transform:translate(-50%,-60%) scale(.8)}
          50% {opacity:1}
          100% {opacity:0; transform:translate(-50%,-40%) scale(1)}
        }

        @keyframes ripple {
          0% {transform:translateY(-50%) scale(.3); opacity:.7}
          100% {transform:translateY(-50%) scale(2); opacity:0}
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
