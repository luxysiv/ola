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

const SEEK_STEP = 10;
const DOUBLE_TAP_DELAY = 250;

const SeekArrows = ({ direction }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: direction === "left" ? "row-reverse" : "row",
      gap: "2px",
    }}
  >
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 0,
          height: 0,
          borderTop: "8px solid transparent",
          borderBottom: "8px solid transparent",
          [direction === "right" ? "borderLeft" : "borderRight"]:
            "12px solid white",
          animation: `arrowsBlink 0.6s infinite ${i * 0.1}s`,
        }}
      />
    ))}
  </Box>
);

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const container = useRef(null);

  const tapTimer = useRef(null);
  const holdTimer = useRef(null);
  const seekStack = useRef(0);

  const [seekData, setSeekData] = useState({ side: null, seconds: 0 });
  const [speedOverlay, setSpeedOverlay] = useState(false);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

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
    clearTimeout(holdTimer.current);

    holdTimer.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
      }
    }, 400);
  };

  const endHold = () => {
    clearTimeout(holdTimer.current);

    if (player.current) player.current.playbackRate = 1;

    setSpeedOverlay(false);
  };

  // TAP HANDLER
  const handleTap = (e) => {
    const rect = container.current.getBoundingClientRect();

    const clientX = e.clientX || e.touches?.[0]?.clientX;
    if (!clientX) return;

    const x = clientX - rect.left;
    const width = rect.width;

    const isLeft = x < width * 0.4;
    const isRight = x > width * 0.6;

    if (!isLeft && !isRight) return;

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);

      const active = player.current;

      seekStack.current += SEEK_STEP;

      if (isLeft) {
        active.currentTime = active.currentTime - SEEK_STEP;

        setSeekData({
          side: "left",
          seconds: seekStack.current,
        });
      } else {
        active.currentTime = active.currentTime + SEEK_STEP;

        setSeekData({
          side: "right",
          seconds: seekStack.current,
        });
      }

      tapTimer.current = setTimeout(() => {
        seekStack.current = 0;
        setSeekData({ side: null, seconds: 0 });
      }, 700);
    } else {
      tapTimer.current = setTimeout(() => {
        tapTimer.current = null;
      }, DOUBLE_TAP_DELAY);
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
          zIndex: 20,
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

        {/* SPEED OVERLAY */}
        {speedOverlay && (
          <Box
            sx={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              bgcolor: "rgba(0,0,0,0.6)",
              px: 2,
              py: 1,
              borderRadius: 2,
              pointerEvents: "none",
              zIndex: 30,
            }}
          >
            <Typography sx={{ fontSize: 22 }}>⚡ 2×</Typography>
          </Box>
        )}

        {/* SEEK LEFT */}
        {seekData.side === "left" && (
          <Box className="seek-container left">
            <Box className="ripple-circle" />
            <SeekArrows direction="left" />
            <Typography sx={{ mt: 1, fontWeight: "bold" }}>
              {seekData.seconds}s
            </Typography>
          </Box>
        )}

        {/* SEEK RIGHT */}
        {seekData.side === "right" && (
          <Box className="seek-container right">
            <Box className="ripple-circle" />
            <SeekArrows direction="right" />
            <Typography sx={{ mt: 1, fontWeight: "bold" }}>
              {seekData.seconds}s
            </Typography>
          </Box>
        )}
      </Box>

      <style>
        {`
        .seek-container{
          position:absolute;
          top:50%;
          transform:translateY(-50%);
          display:flex;
          flex-direction:column;
          align-items:center;
          pointer-events:none;
          z-index:25;
        }

        .seek-container.left{
          left:25%;
        }

        .seek-container.right{
          right:25%;
        }

        .ripple-circle{
          position:absolute;
          width:180px;
          height:180px;
          border-radius:50%;
          background:rgba(255,255,255,.15);
          animation:ripple .6s ease-out;
        }

        @keyframes ripple{
          0%{transform:scale(.4);opacity:.7}
          100%{transform:scale(1.8);opacity:0}
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
