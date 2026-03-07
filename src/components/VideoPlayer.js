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

// --- Icon 3 mũi tên nhấp nháy ---
const SeekArrows = ({ direction }) => (
  <Box sx={{ display: 'flex', flexDirection: direction === 'left' ? 'row-reverse' : 'row', gap: '3px', mb: 1 }}>
    {[0, 1, 2].map((i) => (
      <Box key={i} sx={{
        width: 0, height: 0,
        borderTop: '7px solid transparent',
        borderBottom: '7px solid transparent',
        [direction === 'right' ? 'borderLeft' : 'borderRight']: '9px solid white',
        animation: `arrowsBlink 0.6s infinite ${i * 0.1}s`,
      }} />
    ))}
  </Box>
);

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const seekTimer = useRef(null);
  const accumulator = useRef(0); 

  // State quản lý hiển thị: side (trái/phải), value (số giây), và animKey để reset animation
  const [seekState, setSeekState] = useState({ side: null, value: 0, animKey: 0 });

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // --- Khôi phục logic Lưu lịch sử xem ---
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

  // --- Hàm xử lý Double Tap (Trigger liên tục hiệu ứng) ---
  const handleDoubleTap = (direction) => {
    if (!player.current) return;

    const side = direction === "forward" ? "right" : "left";
    
    // Cộng dồn giây
    if (seekState.side !== side && seekState.side !== null) {
      accumulator.current = 10;
    } else {
      accumulator.current += 10;
    }

    // Lệnh tua thực tế
    player.current.currentTime += (direction === "forward" ? 10 : -10);

    // Cập nhật state và thay đổi animKey để kích hoạt lại CSS Animation
    setSeekState({
      side,
      value: accumulator.current,
      animKey: Date.now() // Dùng timestamp để force restart animation
    });

    // Reset sau 800ms nếu không bấm thêm
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      accumulator.current = 0;
      setSeekState({ side: null, value: 0, animKey: 0 });
    }, 800);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6" noWrap>{title}</Typography>
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
          onEnded={onVideoEnd}
          onCanPlay={() => {
            if (movieInfo?.currentTime > 0 && player.current) {
              player.current.currentTime = movieInfo.currentTime;
            }
          }}
        >
          <MediaProvider>
            {movieInfo?.thumb && <Poster src={movieInfo.thumb} className="vds-poster" />}
          </MediaProvider>

          {/* LỚP PHỦ HIỆU ỨNG VÒNG CUNG (YOUTUBE RIPPLE) */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            
            {/* Vùng bên trái */}
            <Box 
              sx={{ flex: 1, position: 'relative', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTap("back"); }}
            >
              {seekState.side === "left" && (
                <Box className="seek-box left">
                  {/* Mỗi lần animKey đổi, div này sẽ render lại và chạy lại animation */}
                  <Box key={seekState.animKey} className="ripple-arc" />
                  <Box className="seek-content">
                    <SeekArrows direction="left" />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>-{seekState.value}s</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "20%" }} />

            {/* Vùng bên phải */}
            <Box 
              sx={{ flex: 1, position: 'relative', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTap("forward"); }}
            >
              {seekState.side === "right" && (
                <Box className="seek-box right">
                  <Box key={seekState.animKey} className="ripple-arc" />
                  <Box className="seek-content">
                    <SeekArrows direction="right" />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>+{seekState.value}s</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-box {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }

        .seek-content {
          display: flex; flex-direction: column; align-items: center; z-index: 12;
          pointer-events: none;
        }

        .ripple-arc {
          position: absolute; top: 0; bottom: 0; width: 100%;
          background: rgba(255, 255, 255, 0.15);
          pointer-events: none;
        }

        .left .ripple-arc {
          right: 0; border-top-right-radius: 500px; border-bottom-right-radius: 500px;
          transform-origin: right center;
          animation: rippleIn 0.6s ease-out forwards;
        }

        .right .ripple-arc {
          left: 0; border-top-left-radius: 500px; border-bottom-left-radius: 500px;
          transform-origin: left center;
          animation: rippleIn 0.6s ease-out forwards;
        }

        @keyframes rippleIn {
          0% { opacity: 0; transform: scaleX(0.4); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scaleX(1.2); }
        }

        @keyframes arrowsBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
                
