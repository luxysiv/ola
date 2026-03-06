import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import Replay10Icon from "@mui/icons-material/Replay10";
import Forward10Icon from "@mui/icons-material/Forward10";
import SpeedIcon from "@mui/icons-material/Speed";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const SEEK_STEP = 10;

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const container = useRef(null);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  const [seekDisplay, setSeekDisplay] = useState(null);
  const [seekSide, setSeekSide] = useState(null);
  const [speedVisible, setSpeedVisible] = useState(false);

  const seekStack = useRef(0);
  const tapTimeout = useRef(null);
  const holdTimeout = useRef(null);

  // save history
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const active = player.current;

      if (active && !active.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: Math.floor(active.currentTime),
          updatedAt: Date.now(),
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  // HOLD SPEED
  const startHold = () => {
    holdTimeout.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedVisible(true);
      }
    }, 350);
  };

  const endHold = () => {
    clearTimeout(holdTimeout.current);

    if (player.current) player.current.playbackRate = 1;

    setSpeedVisible(false);
  };

  // DOUBLE TAP SEEK
  const handleTap = (e) => {
    const rect = container.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const left = x < width * 0.35;
    const right = x > width * 0.65;

    if (!left && !right) return;

    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);

      seekStack.current += SEEK_STEP;

      const active = player.current;

      if (left) {
        active.currentTime -= SEEK_STEP;
        setSeekSide("left");
      } else {
        active.currentTime += SEEK_STEP;
        setSeekSide("right");
      }

      setSeekDisplay(seekStack.current);

      tapTimeout.current = setTimeout(() => {
        seekStack.current = 0;
        setSeekDisplay(null);
      }, 800);
    } else {
      tapTimeout.current = setTimeout(() => {
        tapTimeout.current = null;
        seekStack.current = 0;
      }, 250);
    }
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box
        ref={container}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          overflow: "hidden",
        }}
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onClick={handleTap}
      >
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          keyTarget="document"
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

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>

        {/* HOLD SPEED */}
        {speedVisible && (
          <Box
            sx={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "rgba(0,0,0,0.6)",
              padding: "10px 16px",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              animation: "fadeSeek .25s",
            }}
          >
            <SpeedIcon sx={{ fontSize: 30 }} />
            <Typography sx={{ fontSize: 22 }}>2×</Typography>
          </Box>
        )}

        {/* SEEK DISPLAY */}
        {seekDisplay && (
          <Box
            sx={{
              position: "absolute",
              top: "40%",
              left: seekSide === "left" ? "25%" : "75%",
              transform: "translate(-50%,-50%)",
              background: "rgba(0,0,0,0.55)",
              padding: "12px 18px",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
              pointerEvents: "none",
              animation: "fadeSeek .25s",
            }}
          >
            {seekSide === "left" ? (
              <Replay10Icon sx={{ fontSize: 40, opacity: 0.9 }} />
            ) : (
              <Forward10Icon sx={{ fontSize: 40, opacity: 0.9 }} />
            )}

            <Typography sx={{ fontSize: 24 }}>{seekDisplay}s</Typography>
          </Box>
        )}

        {/* RIPPLE */}
        <Box className="yt-ripple" />
      </Box>

      <style>
        {`
        @keyframes fadeSeek {
          0% {transform:scale(.8);opacity:0}
          100% {transform:scale(1);opacity:1}
        }

        .yt-ripple{
          position:absolute;
          inset:0;
          pointer-events:none;
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
