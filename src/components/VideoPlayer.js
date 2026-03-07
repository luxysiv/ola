import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history"; // Giả định file này tồn tại

// --- Component Icon 3 mũi tên nhấp nháy ---
const SeekArrows = ({ direction }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: direction === 'left' ? 'row-reverse' : 'row', 
    gap: '3px', // Tăng gap một chút cho rõ
    mb: 1 // Tăng margin bottom
  }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 0, height: 0,
          borderTop: '7px solid transparent', // Tăng kích thước mũi tên
          borderBottom: '7px solid transparent',
          [direction === 'right' ? 'borderLeft' : 'borderRight']: '9px solid white',
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

  const [displaySeek, setDisplaySeek] = useState({ side: null, value: 0 });

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // --- Xử lý Double Tap Tua ---
  const seekVideo = (direction) => {
    if (!player.current) return;

    const side = direction === "forward" ? "right" : "left";
    
    // Cộng dồn hoặc reset số giây
    if (displaySeek.side !== side && displaySeek.side !== null) {
      accumulator.current = 10;
    } else {
      accumulator.current += 10;
    }

    // Thực hiện tua trên player
    player.current.currentTime += (direction === "forward" ? 10 : -10);

    // Cập nhật UI hiển thị số kèm dấu +/-
    setDisplaySeek({
      side: side,
      value: accumulator.current
    });

    // Reset sau 800ms
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
          // Chặn các hành động mặc định của trình duyệt gây xung đột
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <MediaProvider />

          {/* VÙNG TƯƠNG TÁC TUA (Nằm trên video) */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            
            {/* VÙNG LÙI LẠI (Cánh trái - 40% chiều rộng) */}
            <Box 
              sx={{ 
                flex: 1, 
                width: '40%',
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                pointerEvents: 'auto' // Chỉ vùng này nhận double click
              }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("back"); }}
            >
              {displaySeek.side === "left" && (
                <Box className="seek-ui-box left">
                  <Box className="ripple-arc" /> {/* Phần nền vòng cung */}
                  <Box className="seek-content">
                    <SeekArrows direction="left" />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                      -{displaySeek.value}s
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Khoảng trống ở giữa (20%) - Không nhận Double Tap */}
            <Box sx={{ width: "20%" }} />

            {/* VÙNG TIẾN TỚI (Cánh phải - 40% chiều rộng) */}
            <Box 
              sx={{ 
                flex: 1, 
                width: '40%',
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
                  <Box className="ripple-arc" />
                  <Box className="seek-content">
                    <SeekArrows direction="right" />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                      +{displaySeek.value}s
                    </Typography>
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
        .seek-ui-box {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 11;
          pointer-events: none;
        }

        /* Thống nhất nội dung text và icon ở giữa vùng chạm */
        .seek-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 12;
          opacity: 0;
          animation: fadeContent 0.8s ease-out forwards;
        }

        /* Hiệu ứng NỀN VÒNG CUNG (Ripple Arc) - GIỐNG YOUTUBE */
        .ripple-arc {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 100%; /* Chiếm toàn bộ chiều rộng vùng chạm */
          background: rgba(255, 255, 255, 0.1); /* Màu nền mờ nhẹ */
          animation: rippleIn 0.8s ease-out forwards;
        }

        /* Tạo hình vòng cung bằng border-radius lớn lệch bên */
        .left .ripple-arc {
          right: 0;
          border-top-right-radius: 500px;
          border-bottom-right-radius: 500px;
          transform-origin: right center;
        }

        .right .ripple-arc {
          left: 0;
          border-top-left-radius: 500px;
          border-bottom-left-radius: 500px;
          transform-origin: left center;
        }

        @keyframes rippleIn {
          0% { opacity: 0; transform: scaleX(0.4); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scaleX(1.1); }
        }

        @keyframes fadeContent {
          0% { opacity: 0; transform: translateY(10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; }
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
