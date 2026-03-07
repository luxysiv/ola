import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";

const SeekArrows = ({ direction }) => (
  <Box sx={{ display: 'flex', flexDirection: direction === 'left' ? 'row-reverse' : 'row', gap: '2px', mb: 0.5 }}>
    {[0, 1, 2].map((i) => (
      <Box key={i} sx={{
        width: 0, height: 0,
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent',
        [direction === 'right' ? 'borderLeft' : 'borderRight']: '8px solid white',
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

  const seekVideo = (direction) => {
    if (!player.current) return;
    const side = direction === "forward" ? "right" : "left";
    
    accumulator.current = (displaySeek.side === side) ? accumulator.current + 10 : 10;
    player.current.currentTime += (direction === "forward" ? 10 : -10);

    setDisplaySeek({ side, value: accumulator.current });

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
          onEnded={onVideoEnd}
        >
          <MediaProvider />

          {/* VÙNG CHẠM TÀNG HÌNH (INVISIBLE TOUCH ZONES) */}
          <Box sx={{ 
            position: "absolute", 
            inset: 0, 
            display: "flex", 
            zIndex: 10, 
            pointerEvents: 'none' // Cực kỳ quan trọng: Để các click bình thường lọt xuống dưới
          }}>
            {/* Vùng Double Tap Trái (35% chiều rộng) */}
            <Box 
              sx={{ 
                width: '35%', 
                pointerEvents: 'auto', // Chỉ vùng này nhận double click
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("back"); }}
            >
              {displaySeek.side === "left" && (
                <Box className="seek-overlay left">
                  <Box className="ripple" />
                  <SeekArrows direction="left" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    -{displaySeek.value}s
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Khoảng trống ở giữa (30%) - Không nhận Double Tap để tránh đè nút Play/Pause */}
            <Box sx={{ width: '30%' }} />

            {/* Vùng Double Tap Phải (35% chiều rộng) */}
            <Box 
              sx={{ 
                width: '35%', 
                pointerEvents: 'auto',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("forward"); }}
            >
              {displaySeek.side === "right" && (
                <Box className="seek-overlay right">
                  <Box className="ripple" />
                  <SeekArrows direction="right" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    +{displaySeek.value}s
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>{`
        .seek-overlay {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 40%; /* Chỉ chiếm một phần chiều cao để không chắn thanh SeekBar */
          pointer-events: none; /* Hiển thị nhưng không cản trở chuột */
        }
        .ripple {
          position: absolute;
          width: 120%;
          height: 250%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          z-index: -1;
          animation: rippleFade 0.8s ease-out forwards;
        }
        .left .ripple { right: 0; border-radius: 0 500px 500px 0; }
        .right .ripple { left: 0; border-radius: 500px 0 0 500px; }

        @keyframes rippleFade {
          0% { opacity: 0; transform: scale(0.7); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes arrowsBlink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </Card>
  );
};

export default VideoPlayer;
