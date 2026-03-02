import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { Card, Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);
  const containerRef = useRef(null);

  const [brightness, setBrightness] = useState(1);
  const [volume, setVolume] = useState(1);
  const [seekEffect, setSeekEffect] = useState(null);
  const [ripple, setRipple] = useState(null);

  /* =========================
     LOAD STREAM
  ========================= */
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

  /* =========================
     RESUME
  ========================= */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieInfo?.currentTime || hasResumed.current) return;

    const handleLoaded = () => {
      video.currentTime = movieInfo.currentTime;
      hasResumed.current = true;
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, [src, movieInfo?.currentTime]);

  /* =========================
     SAVE HISTORY
  ========================= */
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: video.currentTime,
          updatedAt: Date.now()
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  /* =========================
     GESTURE HANDLER
  ========================= */
  useGesture(
    {
      onDoubleClick: ({ event }) => {
        const video = videoRef.current;
        if (!video) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;

        const isLeft = x < rect.width / 2;
        const delta = isLeft ? -10 : 10;

        video.currentTime += delta;

        setSeekEffect(delta);
        setRipple({ x, y: rect.height / 2 });

        setTimeout(() => {
          setSeekEffect(null);
          setRipple(null);
        }, 600);
      },

      onDrag: ({ movement: [, my], xy: [x] }) => {
        const rect = containerRef.current.getBoundingClientRect();
        const isLeft = x - rect.left < rect.width / 2;

        const percent = -my / 300;

        if (isLeft) {
          const newBrightness = Math.min(2, Math.max(0.3, brightness + percent));
          setBrightness(newBrightness);
        } else {
          const video = videoRef.current;
          const newVolume = Math.min(1, Math.max(0, volume + percent));
          setVolume(newVolume);
          video.volume = newVolume;
        }
      }
    },
    {
      target: containerRef,
      eventOptions: { passive: false }
    }
  );

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          aspectRatio: "16/9",
          overflow: "hidden",
          backgroundColor: "black"
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          controls
          onEnded={onVideoEnd}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `brightness(${brightness})`
          }}
        />

        {/* SEEK EFFECT */}
        <AnimatePresence>
          {seekEffect && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 40,
                fontWeight: "bold",
                pointerEvents: "none"
              }}
            >
              {seekEffect > 0 ? `+10s` : `-10s`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIPPLE EFFECT */}
        <AnimatePresence>
          {ripple && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                position: "absolute",
                top: ripple.y,
                left: ripple.x,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.3)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none"
              }}
            />
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
