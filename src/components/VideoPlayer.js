import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";

// Icon 3 mũi tên nhấp nháy
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
  const holdTimer = useRef(null);
  const seekTimer = useRef(null);
  const isMoving = useRef(false); // Theo dõi nếu người dùng đang vuốt
  const startPos = useRef({ x: 0, y: 0 });
  
  const [displaySeek, setDisplaySeek] = useState({ side: null, value: 0 });
  const [speedOverlay, setSpeedOverlay] = useState(false);
  const accumulator = useRef(0);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // --- XỬ LÝ NHẤN GIỮ X2 THÔNG MINH ---
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'mouse') return;
    
    isMoving.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };

    clearTimeout(holdTimer.current);
    // Đợi một khoảng ngắn để xem người dùng có định vuốt không
    holdTimer.current = setTimeout(() => {
      if (!isMoving.current && player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
        if (navigator.vibrate) navigator.vibrate(40);
      }
    }, 500); // 500ms là khoảng chuẩn để phân biệt Tap và Hold
  };

  const handlePointerMove = (e) => {
    // Nếu tay di chuyển quá 10px thì coi như là hành động vuốt (Seek)
    const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
    if (dist > 10) {
      isMoving.current = true;
      clearTimeout(holdTimer.current); // Hủy x2 nếu đang vuốt
    }
  };

  const stopSpeedUp = () => {
    clearTimeout(holdTimer.current);
    if (player.current && player.current.playbackRate !== 1) {
      player.current.playbackRate = 1;
    }
    setSpeedOverlay(false);
  };

  // --- XỬ LÝ DOUBLE TAP TUA ---
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
          src={proxiedUrl}
          viewType="video"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove} // Lắng nghe di chuyển
          onPointerUp={stopSpeedUp}
          onPointerCancel={stopSpeedUp}
          onPointerLeave={stopSpeedUp}
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          <MediaProvider />

          {/* Tap Zones & UI Tua */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            <Box sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
                 onDoubleClick={(e) => { e.stopPropagation(); seekVideo("back"); }}>
              {displaySeek.side === "left" && (
                <Box className="seek-ui left">
                  <Box className="ripple" />
                  <SeekArrows direction="left" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>-{displaySeek.value}s</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "20%" }} />

            <Box sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
                 onDoubleClick={(e) => { e.stopPropagation(); seekVideo("forward"); }}>
              {displaySeek.side === "right" && (
                <Box className="seek-ui right">
                  <Box className="ripple" />
                  <SeekArrows direction="right" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>+{displaySeek.value}s</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Speed Overlay */}
          {speedOverlay && (
            <Box sx={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", bgcolor: "rgba(0,0,0,0.6)", px: 3, py: 1, borderRadius: 10, zIndex: 20 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>2X ⚡</Typography>
            </Box>
          )}

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>{`
        .seek-ui { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; }
        .ripple { position: absolute; width: 140%; height: 100%; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%); animation: rippleFade 0.8s ease-out forwards; }
        .left .ripple { right: 0; border-radius: 0 500px 500px 0; }
        .right .ripple { left: 0; border-radius: 500px 0 0 500px; }
        @keyframes rippleFade { 0% { opacity: 0; transform: scale(0.8); } 20% { opacity: 1; } 100% { opacity: 0; transform: scale(1.1); } }
        @keyframes arrowsBlink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
      `}</style>
    </Card>
  );
};

export default VideoPlayer;
