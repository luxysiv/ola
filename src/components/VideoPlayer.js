import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { FastBackwardIcon, FastForwardIcon } from '@vidstack/react/icons';

// Import styles
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";

// --- COMPONENT ICON NHẤP NHÁY ---
const SeekArrows = ({ direction }) => {
  const Icon = direction === 'left' ? FastBackwardIcon : FastForwardIcon;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            ml: i > 0 ? -2 : 0, // Hiệu ứng xếp lớp icon
            animation: `arrowsBlink 0.6s infinite ${i * 0.1}s`,
          }}
        >
          <Icon size={40} color="white" />
        </Box>
      ))}
    </Box>
  );
};

const VideoPlayer = ({ src, title }) => {
  const player = useRef(null);
  const holdTimer = useRef(null);
  const seekTimer = useRef(null);
  const isMoving = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  
  const [displaySeek, setDisplaySeek] = useState({ side: null, value: 0 });
  const [speedOverlay, setSpeedOverlay] = useState(false);
  const accumulator = useRef(0);

  // Link qua proxy của bạn
  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // --- LOGIC NHẤN GIỮ ĐỂ X2 ---
  const handlePointerDown = (e) => {
    // Chỉ xử lý chuột trái hoặc chạm tay
    if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'mouse') return;
    
    isMoving.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };

    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      if (!isMoving.current && player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
        if (navigator.vibrate) navigator.vibrate(40);
      }
    }, 500);
  };

  const handlePointerMove = (e) => {
    const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
    if (dist > 10) {
      isMoving.current = true;
      clearTimeout(holdTimer.current);
    }
  };

  const stopSpeedUp = () => {
    clearTimeout(holdTimer.current);
    if (player.current && player.current.playbackRate !== 1) {
      player.current.playbackRate = 1;
    }
    setSpeedOverlay(false);
  };

  // --- LOGIC DOUBLE TAP TUA 10S ---
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
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, overflow: 'hidden', borderRadius: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", position: "relative" }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopSpeedUp}
          onPointerCancel={stopSpeedUp}
          onPointerLeave={stopSpeedUp}
          onContextMenu={(e) => e.preventDefault()} // Chặn menu chuột phải/nhấn giữ mobile
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          <MediaProvider />

          {/* Layer UI Tùy chỉnh: Tua & Speed */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            
            {/* Vùng bên trái */}
            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("back"); }}
            >
              {displaySeek.side === "left" && (
                <Box className="seek-ui left">
                  <Box className="ripple" />
                  <SeekArrows direction="left" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', zIndex: 2 }}>-{displaySeek.value}s</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "20%" }} /> {/* Khoảng trống ở giữa để tránh chạm nhầm */}

            {/* Vùng bên phải */}
            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("forward"); }}
            >
              {displaySeek.side === "right" && (
                <Box className="seek-ui right">
                  <Box className="ripple" />
                  <SeekArrows direction="right" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', zIndex: 2 }}>+{displaySeek.value}s</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Overlay hiển thị khi đang X2 */}
          {speedOverlay && (
            <Box sx={{ 
              position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", 
              bgcolor: "rgba(0,0,0,0.7)", px: 3, py: 1, borderRadius: 10, zLayer: 20,
              display: 'flex', alignItems: 'center', gap: 1
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffad00' }}>2X Speed ⚡</Typography>
            </Box>
          )}

          {/* Layout mặc định của Vidstack (đã cấu hình ẩn icon giữa bằng CSS bên dưới) */}
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>{`
        /* Ẩn icon Play/Pause mặc định ở chính giữa màn hình */
        .vds-video-layout :where(.vds-play-button[data-slot="center-play"]) {
          display: none !important;
        }

        .seek-ui { 
          display: flex; flex-direction: column; align-items: center; justify-content: center; 
          width: 100%; height: 100%; position: relative;
        }
        
        .ripple { 
          position: absolute; width: 120%; height: 80%; 
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%); 
          animation: rippleFade 0.7s ease-out forwards; 
        }
        
        .left .ripple { right: 0; border-radius: 0 500px 500px 0; }
        .right .ripple { left: 0; border-radius: 500px 0 0 500px; }

        @keyframes rippleFade { 
          0% { opacity: 0; transform: scale(0.8); } 
          30% { opacity: 1; } 
          100% { opacity: 0; transform: scale(1.2); } 
        }

        @keyframes arrowsBlink { 
          0%, 100% { opacity: 0.2; transform: scale(0.9); } 
          50% { opacity: 1; transform: scale(1.1); } 
        }
      `}</style>
    </Card>
  );
};

export default VideoPlayer;
