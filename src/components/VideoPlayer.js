import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";
// Giả định file utils của bạn vẫn giữ nguyên
import { saveHistoryItem } from "../utils/history";

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

  // Lưu lịch sử xem
  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const activePlayer = player.current;
      if (activePlayer && !activePlayer.paused) {
        // saveHistoryItem({ ...movieInfo, currentTime: Math.floor(activePlayer.currentTime), updatedAt: Date.now() });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  // Xử lý NHẤN GIỮ ĐỂ X2
  const handlePointerDown = (e) => {
    // Chỉ nhận chuột trái hoặc cảm ứng
    if (e.button !== 0 && e.pointerType !== 'mouse' && e.pointerType !== 'touch') return;

    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
        if (navigator.vibrate) navigator.vibrate(40); // Rung nhẹ báo hiệu đã vào mode x2
      }
    }, 500); // Đợi 0.5s để phân biệt với Tap/Double Tap
  };

  const stopSpeedUp = () => {
    clearTimeout(holdTimer.current);
    if (player.current) {
      player.current.playbackRate = 1;
    }
    setSpeedOverlay(false);
  };

  // Xử lý DOUBLE TAP TUA
  const seekVideo = (direction) => {
    if (!player.current) return;

    const step = 10;
    if (direction === "forward") {
      player.current.currentTime += step;
    } else {
      player.current.currentTime -= step;
    }

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
          // Gán sự kiện vào player
          onPointerDown={handlePointerDown}
          onPointerUp={stopSpeedUp}
          onPointerCancel={stopSpeedUp}
          onPointerLeave={stopSpeedUp}
          onEnded={onVideoEnd}
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
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

          {/* VÙNG TƯƠNG TÁC TUA (Nằm trên video nhưng dưới Controls) */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            {/* Cánh trái */}
            <Box 
              sx={{ 
                flex: 1, 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                pointerEvents: 'auto' // Chỉ vùng này nhận double click
              }} 
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

            {/* Khoảng giữa để pause/play bình thường */}
            <Box sx={{ width: "20%" }} />

            {/* Cánh phải */}
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
              {seekData.side === "right" && (
                <Box className="seek-overlay-box right">
                  <Box className="ripple-bg" />
                  <SeekArrows direction="right" />
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{seekData.seconds} GIÂY</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* NHÃN TỐC ĐỘ 2X */}
          {speedOverlay && (
            <Box
              sx={{
                position: "absolute",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(0,0,0,0.5)",
                backdropFilter: 'blur(4px)',
                px: 2, py: 0.5,
                borderRadius: 4,
                zIndex: 20,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                2X Tốc độ phát ⚡
              </Typography>
            </Box>
          )}

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-overlay-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 11;
          pointer-events: none;
          width: 100%;
          height: 100%;
        }

        .ripple-bg {
          position: absolute;
          width: 140%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          border-radius: 50%;
          animation: rippleEffect 0.7s ease-out forwards;
        }

        .left .ripple-bg { right: 0; transform: translateX(30%); }
        .right .ripple-bg { left: 0; transform: translateX(-30%); }

        @keyframes rippleEffect {
          0% { opacity: 0; transform: scale(0.5) translateY(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.2) translateY(0); }
        }

        @keyframes arrowsBlink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        /* Tối ưu UI trên Mobile */
        .vds-video-layout {
          --video-skip-size: 40px;
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
