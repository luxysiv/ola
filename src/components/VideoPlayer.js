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

const SeekArrows = ({ direction }) => (
  <Box sx={{ display: "flex", flexDirection: direction === "left" ? "row-reverse" : "row", gap: "3px", mb: 1 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 0,
          height: 0,
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          [direction === "right" ? "borderLeft" : "borderRight"]: "9px solid white",
          animation: `arrowsBlink 0.6s infinite ${i * 0.1}s`,
        }}
      />
    ))}
  </Box>
);

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);

  const seekTimer = useRef(null);
  const accumulator = useRef(0);
  const lastTap = useRef(0);

  const [seekState, setSeekState] = useState({ side: null, value: 0 });

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // ===== Save history (tối ưu mobile) =====
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const p = player.current;

      if (p && !p.paused && p.currentTime > 0) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: Math.floor(p.currentTime),
          updatedAt: Date.now(),
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  // ===== Double tap detection (iOS friendly) =====
  const handleTap = (direction) => {
    const now = Date.now();

    if (now - lastTap.current < 300) {
      handleSeek(direction);
    }

    lastTap.current = now;
  };

  const handleSeek = (direction) => {
    if (!player.current) return;

    const side = direction === "forward" ? "right" : "left";

    accumulator.current =
      seekState.side !== side ? 10 : accumulator.current + 10;

    player.current.currentTime += direction === "forward" ? 10 : -10;

    setSeekState({
      side,
      value: accumulator.current,
    });

    clearTimeout(seekTimer.current);

    seekTimer.current = setTimeout(() => {
      accumulator.current = 0;
      setSeekState({ side: null, value: 0 });
    }, 800);
  };

  useEffect(() => {
    return () => clearTimeout(seekTimer.current);
  }, []);

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, overflow: "hidden" }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", position: "relative" }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          crossOrigin
          load="visible"
          onEnded={onVideoEnd}
          onCanPlay={() => {
            if (movieInfo?.currentTime > 0 && player.current) {
              player.current.currentTime = movieInfo.currentTime;
            }
          }}
        >
          <MediaProvider>
            {movieInfo?.thumb && (
              <Poster src={movieInfo.thumb} className="vds-poster" />
            )}
          </MediaProvider>

          {/* Touch zones */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              zIndex: 10,
            }}
          >
            {/* left */}
            <Box
              sx={{ flex: 1 }}
              onTouchStart={() => handleTap("back")}
              onDoubleClick={() => handleSeek("back")}
            >
              {seekState.side === "left" && (
                <Box className="seek-box">
                  <SeekArrows direction="left" />
                  <Typography variant="h5">-{seekState.value}s</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "20%" }} />

            {/* right */}
            <Box
              sx={{ flex: 1 }}
              onTouchStart={() => handleTap("forward")}
              onDoubleClick={() => handleSeek("forward")}
            >
              {seekState.side === "right" && (
                <Box className="seek-box">
                  <SeekArrows direction="right" />
                  <Typography variant="h5">+{seekState.value}s</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-box{
          position:absolute;
          inset:0;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          background:rgba(255,255,255,0.12);
          backdrop-filter: blur(2px);
        }

        @keyframes arrowsBlink{
          0%,100%{opacity:.3}
          50%{opacity:1}
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
