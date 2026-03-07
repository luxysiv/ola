import React, { useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";

// --- Icon 3 mũi tên nhấp nháy ---
const SeekArrows = ({ direction }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: direction === 'left' ? 'row-reverse' : 'row', 
    gap: '3px', mb: 1 
  }}>
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

  const [displaySeek, setDisplaySeek] = useState({ side: null, value: 0 });

  // Hàm xử lý khi Double Tap
  const handleDoubleTap = (direction) => {
    if (!player.current) return;

    const side = direction === "forward" ? "right" : "left";
    
    // 1. Cộng dồn số giây để hiển thị
    if (displaySeek.side !== side && displaySeek.side !== null) {
      accumulator.current = 10;
    } else {
      accumulator.current += 10;
    }

    // 2. Gọi lệnh tua của Vidstack (mặc định là 10s)
    if (direction === "forward") {
        player.current.currentTime += 10;
    } else {
        player.current.currentTime -= 10;
    }

    // 3. Hiển thị UI vòng cung
    setDisplaySeek({ side, value: accumulator.current });

    // Reset UI sau 800ms
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      accumulator.current = 0;
      setDisplaySeek({ side: null, value: 0 });
    }, 800);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, overflow: 'hidden' }}>
      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", position: "relative" }}>
        <MediaPlayer
          ref={player}
          src={src}
          viewType="video"
          streamType="on-demand"
          playsInline
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

          {/* LỚP PHỦ HIỂN THỊ VÒNG CUNG VÀ SỐ GIÂY (GIỐNG YOUTUBE) */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            
            {/* Vùng bên trái */}
            <Box 
              sx={{ flex: 1, position: 'relative', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTap("back"); }}
            >
              {displaySeek.side === "left" && (
                <Box className="seek-container left">
                  <Box className="ripple-arc" />
                  <Box className="seek-content">
                    <SeekArrows direction="left" />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>-{displaySeek.value}s</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Khoảng hở giữa để click play/pause bình thường */}
            <Box sx={{ width: "20%" }} />

            {/* Vùng bên phải */}
            <Box 
              sx={{ flex: 1, position: 'relative', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleTap("forward"); }}
            >
              {displaySeek.side === "right" && (
                <Box className="seek-container right">
                  <Box className="ripple-arc" />
                  <Box className="seek-content">
                    <SeekArrows direction="right" />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>+{displaySeek.value}s</Typography>
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
        .seek-container {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }

        .seek-content {
          display: flex; flex-direction: column; align-items: center; z-index: 12;
          animation: fadeContent 0.8s ease-out forwards;
        }

        /* Hiệu ứng NỀN VÒNG CUNG */
        .ripple-arc {
          position: absolute; top: 0; bottom: 0; width: 100%;
          background: rgba(255, 255, 255, 0.12);
          animation: rippleIn 0.8s ease-out forwards;
        }

        .left .ripple-arc {
          right: 0; border-top-right-radius: 500px; border-bottom-right-radius: 500px;
          transform-origin: right center;
        }

        .right .ripple-arc {
          left: 0; border-top-left-radius: 500px; border-bottom-left-radius: 500px;
          transform-origin: left center;
        }

        @keyframes rippleIn {
          0% { opacity: 0; transform: scaleX(0.5); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scaleX(1.2); }
        }

        @keyframes fadeContent {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
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
