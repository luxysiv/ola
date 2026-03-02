import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";

const Ripple = ({ x, y }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0.6 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: y,
        left: x,
        width: 100,
        height: 100,
        borderRadius: "50%",
        backgroundColor: "rgba(255,255,255,0.5)",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none"
      }}
    />
  );
};

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);

  const [feedback, setFeedback] = useState(null); // hiển thị +10s / -10s
  const [brightness, setBrightness] = useState(1);
  const [volume, setVolume] = useState(1);
  const [ripple, setRipple] = useState(null);

  // Reset resume khi đổi src
  useEffect(() => {
    hasResumed.current = false;
  }, [src]);

  /* Load video stream */
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

  /* Resume */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieInfo.currentTime || hasResumed.current) return;

    const handleCanPlay = () => {
      if (!hasResumed.current) {
        video.currentTime = movieInfo.currentTime;
        hasResumed.current = true;
      }
    };

    video.addEventListener("loadedmetadata", handleCanPlay);
    return () => video.removeEventListener("loadedmetadata", handleCanPlay);
  }, [src, movieInfo.currentTime]);

  /* Save history */
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

  /* Gesture */
  useGesture(
    {
      onDoubleTap: ({ event }) => {
        const video = videoRef.current;
        if (!video) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (x < rect.width / 2) {
          video.currentTime = Math.max(video.currentTime - 10, 0);
          setFeedback("-10s");
        } else {
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
          setFeedback("+10s");
        }

        setRipple({ x, y }); // tạo ripple tại vị trí tap
        setTimeout(() => {
          setFeedback(null);
          setRipple(null);
        }, 800);
      },
      onDrag: ({ event, movement: [, my] }) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const video = videoRef.current;
        if (!video) return;

        if (x < rect.width / 2) {
          // Brightness
          let newBrightness = Math.min(Math.max(brightness - my * 0.005, 0.2), 2);
          setBrightness(newBrightness);
        } else {
          // Volume
          let newVolume = Math.min(Math.max(volume - my * 0.005, 0), 1);
          setVolume(newVolume);
          video.volume = newVolume;
        }
      }
    },
    { target: videoRef }
  );

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box
        sx={{
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          bgcolor: "black",
          aspectRatio: "16/9",
          position: "relative",
          overflow: "hidden"
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
            filter: `brightness(${brightness})`
          }}
        />
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "white",
                fontSize: "2rem",
                fontWeight: "bold"
              }}
            >
              {feedback}
            </motion.div>
          )}
        </AnimatePresence>

        {ripple && <Ripple x={ripple.x} y={ripple.y} />}
      </Box>
    </Card>
  );
};

export default VideoPlayer;
