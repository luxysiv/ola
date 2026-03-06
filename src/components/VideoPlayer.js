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

// Component Icon 3 mũi tên nhấp nháy
const SeekArrows = ({ direction }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: direction === 'left' ? 'row-reverse' : 'row', 
    gap: '2px',
    mb: 1 
  }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 0, height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          [direction === 'right' ? 'borderLeft' : 'borderRight']: '8px solid white',
          animation: `arrowsBlink 0.6s infinite ${i * 0.1}s`,
        }}
      />
    ))}
  </Box>
);

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const holdTimer = useRef(null);
  const seekTimer = useRef(null);
  const stackSeek = useRef(0);

  const [seekSide, setSeekSide] = useState(null); // 'left' hoặc 'right'
  const [speedOverlay, setSpeedOverlay] = useState(false);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

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

  // Nhấn giữ -> x2 speed
  const handlePointerDown = (e) => {
    // Chỉ nhận chuột trái hoặc touch để tránh lỗi
    if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'mouse') return;
    
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
      }
    }, 400); // Tăng lên 400ms để ổn định hơn
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    if (player.current) {
      player.current.playbackRate = 1;
    }
    setSpeedOverlay(false);
  };

  // Double tap tua
  const seekVideo = (direction) => {
    if (!player.current) return;

    stackSeek.current += 10;
    const side = direction === "forward" ? "right" : "left";
    
    player.current.currentTime += direction === "forward" ? 10 : -10;
    setSeekSide(side);

    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      stackSeek.current = 0;
      setSeekSide(null);
    }, 800);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, overflow: 'hidden' }}>
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
          crossOrigin
          load="eager"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onEnded={onVideoEnd}
          // Chặn các hành động mặc định của trình duyệt gây ngắt x2
          style={{ touchAction: 'none', userSelect: 'none' }}
          onCanPlay={() => {
            if (movieInfo?.currentTime > 0 && player.current) {
              player.current.currentTime = movieInfo.currentTime;
            }
          }}
        >
          <MediaProvider>
            {movieInfo?.thumb && (
              <Poster src={movieInfo.thumb} alt={movieInfo.name} className="vds-poster" />
            )}
          </MediaProvider>

          {/* Vùng cảm ứng Tap Zones */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10 }}>
            {/* Left Zone */}
            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onDoubleClick={() => seekVideo("back")}
            >
              {seekSide === "left" && (
                <Box className="seek-overlay left">
                  <Box className="ripple-bg" />
                  <SeekArrows direction="left" />
                  <Typography variant="button" sx={{ fontWeight: 'bold' }}>{stackSeek.current} giây</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "20%" }} />

            {/* Right Zone */}
            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onDoubleClick={() => seekVideo("forward")}
            >
              {seekSide === "right" && (
                <Box className="seek-overlay right">
                  <Box className="ripple-bg" />
                  <SeekArrows direction="right" />
                  <Typography variant="button" sx={{ fontWeight: 'bold' }}>{stackSeek.current} giây</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Speed Overlay 2x */}
          {speedOverlay && (
            <Box sx={{
              position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
              bgcolor: "rgba(0,0,0,0.6)", px: 2, py: 0.5, borderRadius: 10, zIndex: 20
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Gấp đôi tốc độ ⚡</Typography>
            </Box>
          )}

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-overlay {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 11; pointer-events: none; width: 100%; height: 100%;
          animation: fadeSeek 0.8s ease-out forwards;
        }

        .ripple-bg {
          position: absolute; width: 140%; height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
          border-radius: 50%;
        }

        .left .ripple-bg { right: 0; border-top-right-radius: 100%; border-bottom-right-radius: 100%; }
        .right .ripple-bg { left: 0; border-top-left-radius: 100%; border-bottom-left-radius: 100%; }

        @keyframes fadeSeek {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes arrowsBlink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
