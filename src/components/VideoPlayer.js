import React, { useRef, useState, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag, useGesture } from "@use-gesture/react";
import { saveHistoryItem } from "../utils/history";

const SEEK_TIME = 10; // giây

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const hasResumed = useRef(false);

  // Trạng thái overlay feedback
  const [seekFeedback, setSeekFeedback] = useState(null); // { type: "forward"|"backward", time: number }
  const [brightness, setBrightness] = useState(1); // 0.2 → 2
  const [volume, setVolume] = useState(1); // 0 → 1

  // Reset khi src thay đổi
  useEffect(() => {
    hasResumed.current = false;
    setBrightness(1);
    setVolume(1);
  }, [src]);

  // Load HLS
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    if (hlsRef.current) hlsRef.current.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  // Resume time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieInfo?.currentTime || hasResumed.current) return;

    const handleCanPlay = () => {
      if (!hasResumed.current) {
        video.currentTime = movieInfo.currentTime;
        hasResumed.current = true;
      }
    };

    video.addEventListener("loadedmetadata", handleCanPlay);
    return () => video.removeEventListener("loadedmetadata", handleCanPlay);
  }, [src, movieInfo?.currentTime]);

  // Lưu lịch sử mỗi 5s
  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: video.currentTime,
          updatedAt: Date.now(),
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  // Xử lý âm lượng
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  // Gesture chính
  useGesture(
    {
      onDrag: useDrag(({ event, movement: [mx, my], down, first, last, tap }) => {
        if (tap) return; // sẽ xử lý ở onTap / double tap riêng

        const rect = containerRef.current.getBoundingClientRect();
        const xPercent = (event.clientX - rect.left) / rect.width;

        // Bên trái màn hình → brightness
        if (xPercent < 0.35) {
          if (first) {
            // có thể lưu giá trị ban đầu nếu muốn smooth hơn
          }
          setBrightness((prev) => {
            const delta = my / 300; // nhạy cảm
            return Math.max(0.2, Math.min(2, prev - delta));
          });
        }
        // Bên phải → volume
        else if (xPercent > 0.65) {
          setVolume((prev) => {
            const delta = my / 300;
            return Math.max(0, Math.min(1, prev - delta));
          });
        }

        // Ngăn scroll page khi kéo trên mobile
        if (down) event.preventDefault();
      }, { preventDefault: true, filterTaps: true }),

      // Double tap logic (useGesture không có onDoubleTap sẵn → dùng tap count thủ công)
      onClickCapture: ({ event }) => {
        // Vì @use-gesture không có double-tap built-in giống react-native-gesture-handler
        // ta dùng native event để đếm tap
      },
    },
    { target: containerRef, drag: { filterTaps: true } }
  );

  // Xử lý double tap bằng native + timer
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const handleTap = useCallback(
    (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isRightSide = x / rect.width > 0.5;

      tapCountRef.current += 1;

      if (tapCountRef.current === 1) {
        tapTimerRef.current = setTimeout(() => {
          // single tap → có thể để hiện controls nếu muốn
          tapCountRef.current = 0;
        }, 300);
      } else if (tapCountRef.current === 2) {
        clearTimeout(tapTimerRef.current);
        tapCountRef.current = 0;

        const video = videoRef.current;
        if (!video) return;

        let newTime;
        if (isRightSide) {
          // tua tới
          newTime = video.currentTime + SEEK_TIME;
          setSeekFeedback({ type: "forward", time: SEEK_TIME });
        } else {
          // tua lùi
          newTime = Math.max(0, video.currentTime - SEEK_TIME);
          setSeekFeedback({ type: "backward", time: SEEK_TIME });
        }

        video.currentTime = newTime;

        // Tự ẩn feedback sau 800ms
        setTimeout(() => setSeekFeedback(null), 800);
      }
    },
    [setSeekFeedback]
  );

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box
        ref={containerRef}
        onClickCapture={handleTap} // bắt double tap
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          bgcolor: "black",
          aspectRatio: "16/9",
          overflow: "hidden",
          touchAction: "none", // rất quan trọng để ngăn scroll page
          userSelect: "none",
        }}
      >
        <video
          ref={videoRef}
          controls
          autoPlay
          onEnded={onVideoEnd}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `brightness(${brightness})`,
            transition: "filter 0.2s",
          }}
        />

        {/* Overlay feedback seek ±10s + ripple */}
        <AnimatePresence>
          {seekFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.9, scale: 1 }}
              exit={{ opacity: 0, scale: 1.4, transition: { duration: 0.4 } }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: "50%",
                left: seekFeedback.type === "forward" ? "70%" : "30%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                color: "white",
                fontSize: "3.5rem",
                fontWeight: "bold",
                textShadow: "0 0 20px black",
                zIndex: 20,
              }}
            >
              {seekFeedback.type === "forward" ? "+" : "-"}
              {seekFeedback.time}s

              {/* Ripple wave effect */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: "3px solid white",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brightness indicator (trái) */}
        <AnimatePresence>
          {brightness !== 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                padding: "8px 16px",
                borderRadius: 8,
                color: "white",
                fontSize: "1.1rem",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              Brightness: {Math.round(brightness * 100)}%
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume indicator (phải) */}
        <AnimatePresence>
          {volume !== 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.6)",
                padding: "8px 16px",
                borderRadius: 8,
                color: "white",
                fontSize: "1.1rem",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              Volume: {Math.round(volume * 100)}%
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
