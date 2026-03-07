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

// Component Icon 3 mũi tên nhấp nháy phong cách YouTube
const SeekArrows = ({ direction }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: direction === 'left' ? 'row-reverse' : 'row', 
    gap: '2px', 
    mb: 0.5 
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
  const seekTimer = useRef(null);
  const accumulator = useRef(0); // Ref để cộng dồn số giây tức thì

  const [displaySeek, setDisplaySeek] = useState({ side: null, value: 0 });

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // Lưu lịch sử xem
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

  // Hàm xử lý Double Tap Tua (YouTube Style)
  const seekVideo = (direction) => {
    if (!player.current) return;

    const side = direction === "forward" ? "right" : "left";
    
    // Nếu đang tua bên này mà bấm bên kia thì reset số giây ngay
    if (displaySeek.side !== side && displaySeek.side !== null) {
      accumulator.current = 10;
    } else {
      accumulator.current += 10;
    }

    // Thực hiện tua video thực tế
    player.current.currentTime += (direction === "forward" ? 10 : -10);

    // Cập nhật giao diện hiển thị số kèm dấu +/-
    setDisplaySeek({
      side: side,
      value: accumulator.current
    });

    // Sau 800ms không bấm nữa thì ẩn UI và reset số cộng dồn
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      accumulator.current = 0;
      setDisplaySeek({ side: null, value: 0 });
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
            {movieInfo?.thumb && (
              <Poster src={movieInfo.thumb} alt={movieInfo.name} className="vds-poster" />
            )}
          </MediaProvider>

          {/* Vùng Tap Zones tương tác (Nằm trên video) */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            
            {/* VÙNG LÙI LẠI (Bên trái) */}
            <Box 
              sx={{ 
                flex: 1, 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                pointerEvents: 'auto' // Chỉ nhận sự kiện ở vùng này
              }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("back"); }}
            >
              {displaySeek.side === "left" && (
                <Box className="seek-ui-box left">
                  <Box className="ripple-bg" />
                  <SeekArrows direction="left" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    -{displaySeek.value}s
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Khoảng trống ở giữa để dùng controls mặc định */}
            <Box sx={{ width: "20%" }} />

            {/* VÙNG TIẾN TỚI (Bên phải) */}
            <Box 
              sx={{ 
                flex: 1, 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                pointerEvents: 'auto'
              }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("forward"); }}
            >
              {displaySeek.side === "right" && (
                <Box className="seek-ui-box right">
                  <Box className="ripple-bg" />
                  <SeekArrows direction="right" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    +{displaySeek.value}s
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-ui-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          width: 100%; height: 100%; z-index: 11; pointer-events: none;
        }

        .ripple-bg {
          position: absolute; width: 140%; height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          animation: rippleFade 0.8s ease-out forwards;
        }

        /* Hiệu ứng mờ bo theo cạnh màn hình */
        .left .ripple-bg { right: 0; border-radius: 0 500px 500px 0; }
        .right .ripple-bg { left: 0; border-radius: 500px 0 0 500px; }

        @keyframes rippleFade {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.1); }
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
