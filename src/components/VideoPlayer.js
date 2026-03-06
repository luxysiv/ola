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

  const holdTimeout = useRef(null);
  const tapTimeout = useRef(null);

  const stackSeek = useRef(0);

  const [speedOverlay, setSpeedOverlay] = useState(false);
  const [seekOverlay, setSeekOverlay] = useState(null);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // lưu lịch sử
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

  // giữ để 2x
  const handlePointerDown = () => {
    holdTimeout.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
      }
    }, 300);
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimeout.current);

    if (player.current) {
      player.current.playbackRate = 1;
    }

    setSpeedOverlay(false);
  };

  // double tap stack
  const handleDoubleTap = (direction) => {
    if (!player.current) return;

    stackSeek.current += 10;

    if (direction === "forward") {
      player.current.currentTime += 10;
      setSeekOverlay(`+${stackSeek.current}s`);
    } else {
      player.current.currentTime -= 10;
      setSeekOverlay(`-${stackSeek.current}s`);
    }

    clearTimeout(tapTimeout.current);

    tapTimeout.current = setTimeout(() => {
      stackSeek.current = 0;
      setSeekOverlay(null);
    }, 700);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", position: "relative" }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          seekStep={10}
          load="eager"
          crossOrigin
          onEnded={onVideoEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
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

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>

        {/* overlay tốc độ */}
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
            }}
          >
            ⚡2×
          </Box>
        )}

        {/* overlay seek */}
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
              animation: "fadeSeek 0.6s",
            }}
          >
            {seekOverlay}
          </Box>
        )}
      </Box>

      <style>
        {`
        @keyframes fadeSeek {
          0% {opacity:0; transform:translate(-50%,-60%) scale(.8)}
          50% {opacity:1}
          100% {opacity:0; transform:translate(-50%,-40%) scale(1)}
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
