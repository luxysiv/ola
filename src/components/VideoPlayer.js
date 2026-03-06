import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";

// --- CẤU HÌNH CUSTOM ICONS ---
const None = () => null;
const customIcons = {
  ...defaultLayoutIcons, // Giữ lại các icon cơ bản nếu muốn, hoặc bỏ dòng này để dùng None hoàn toàn
  AirPlayButton: { Default: None, Connecting: None, Connected: None },
  GoogleCastButton: { Default: None, Connecting: None, Connected: None },
  // Bạn có thể thêm các icon None khác từ danh sách của bạn ở đây...
};

// --- COMPONENT ICON TUA (YOUTUBE STYLE) ---
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
          width: 0,
          height: 0,
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
  
  const [seekData, setSeekData] = useState({ side: null, seconds: 0 });
  const [speedOverlay, setSpeedOverlay] = useState(false);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // Xử lý NHẤN GIỮ ĐỂ X2 (Fix lỗi tự ngắt)
  const handlePointerDown = (e) => {
    // Chỉ nhận chuột trái hoặc touch
    if (e.button !== 0 && e.pointerType !== 'mouse' && e.pointerType !== 'touch') return;

    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
        if (navigator.vibrate) navigator.vibrate(40);
      }
    }, 500); 
  };

  const stopSpeedUp = (e) => {
    clearTimeout(holdTimer.current);
    if (player.current && player.current.playbackRate !== 1) {
      player.current.playbackRate = 1;
    }
    setSpeedOverlay(false);
  };

  // Xử lý DOUBLE TAP TUA
  const seekVideo = (direction) => {
    if (!player.current) return;
    const step = 10;
    player.current.currentTime += (direction === "forward" ? step : -step);

    setSeekData(prev => ({
      side: direction === "forward" ? "right" : "left",
      seconds: prev.side === (direction === "forward" ? "right" : "left") ? prev.seconds + step : step
    }));

    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      setSeekData({ side: null, seconds: 0 });
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
          // Gán sự kiện trực tiếp vào Player để bao quát toàn vùng
          onPointerDown={handlePointerDown}
          onPointerUp={stopSpeedUp}
          onPointerCancel={stopSpeedUp}
          onPointerLeave={stopSpeedUp}
          onEnded={onVideoEnd}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <MediaProvider />

          {/* VÙNG TƯƠNG TÁC TUA (Nằm trên video) */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("back"); }}
            >
              {seekData.side === "left" && (
                <Box className="seek-overlay-box left">
                  <Box className="ripple-bg" />
                  <SeekArrows direction="left" />
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{seekData.seconds} GIÂY</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "20%" }} />

            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("forward"); }}
            >
              {seekData.side === "right" && (
                <Box className="seek-overlay-box right">
                  <Box className="ripple-bg" />
                  <SeekArrows direction="right" />
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{seekData.seconds} GIÂY</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* HIỂN THỊ TỐC ĐỘ 2X */}
          {speedOverlay && (
            <Box sx={{
              position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
              bgcolor: "rgba(0,0,0,0.5)", backdropFilter: 'blur(4px)',
              px: 2, py: 0.5, borderRadius: 4, zIndex: 20, pointerEvents: 'none'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>2X Tốc độ phát ⚡</Typography>
            </Box>
          )}

          {/* LAYOUT VỚI CUSTOM ICONS CỦA BẠN */}
          <DefaultVideoLayout icons={customIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-overlay-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 11; pointer-events: none; width: 100%; height: 100%;
        }
        .ripple-bg {
          position: absolute; width: 140%; height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          border-radius: 50%; animation: rippleEffect 0.7s ease-out forwards;
        }
        .left .ripple-bg { right: 0; transform: translateX(30%); }
        .right .ripple-bg { left: 0; transform: translateX(-30%); }

        @keyframes rippleEffect {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.2); }
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
