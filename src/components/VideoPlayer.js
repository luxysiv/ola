import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton } from "@mui/material";
import { saveHistoryItem } from "../utils/history";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrightnessHigh,
  BrightnessLow,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Forward10,
  Replay10,
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Settings
} from "@mui/icons-material";

const VideoPlayer = ({
  src,
  title,
  movieInfo,
  onVideoEnd,
  currentEpisode,
  onPrevEpisode,
  onNextEpisode
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);
  const controlsTimeoutRef = useRef(null);
  const initialValueRef = useRef(0);

  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [waveformBars, setWaveformBars] = useState([]);
  const [showSeekIndicator, setShowSeekIndicator] = useState(false);
  const [seekDirection, setSeekDirection] = useState(null);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  /* =========================
     WAVEFORM EFFECT
  ========================= */
  const generateWaveform = useCallback(() => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      bars.push({
        id: i,
        height: Math.random() * 40 + 10,
        delay: i * 0.02
      });
    }
    setWaveformBars(bars);
    setTimeout(() => setWaveformBars([]), 800);
  }, []);

  /* =========================
     DOUBLE TAP SEEK
  ========================= */
  const handleDoubleTap = (direction) => {
    if (!videoRef.current) return;

    const seekTime = direction === "forward" ? 10 : -10;
    const video = videoRef.current;

    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + seekTime)
    );

    setSeekDirection(direction);
    setShowSeekIndicator(true);
    generateWaveform();

    setTimeout(() => setShowSeekIndicator(false), 800);
  };

  /* =========================
     PLAY / PAUSE
  ========================= */
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  /* =========================
     FULLSCREEN
  ========================= */
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /* =========================
     GESTURES
  ========================= */
  const bindGestures = useGesture(
    {
      onClick: ({ event }) => {
        event.stopPropagation();
        togglePlay();
      },

      onDoubleClick: ({ event }) => {
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const direction =
          x < rect.width / 2 ? "backward" : "forward";
        handleDoubleTap(direction);
      },

      onDrag: ({ first, movement: [, my], event }) => {
        event.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;

        const leftZone = width * 0.2;
        const rightZone = width * 0.8;

        if (first) {
          if (x < leftZone) initialValueRef.current = brightness;
          if (x > rightZone) initialValueRef.current = volume;
        }

        const percent = -my / rect.height;

        if (x < leftZone) {
          const newBrightness = Math.max(
            20,
            Math.min(150, initialValueRef.current + percent * 150)
          );
          setBrightness(newBrightness);
          setShowBrightnessIndicator(true);
        } else if (x > rightZone) {
          const newVolume = Math.max(
            0,
            Math.min(1, initialValueRef.current + percent)
          );
          setVolume(newVolume);
          videoRef.current.volume = newVolume;
          setShowVolumeIndicator(true);
        }
      }
    },
    {
      drag: {
        axis: "y",
        filterTaps: true,
        pointer: { touch: true }
      }
    }
  );

  /* =========================
     LOAD HLS
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
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      hlsRef.current = hls;
    } else {
      video.src = proxiedUrl;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  /* =========================
     TIME EVENTS
  ========================= */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("durationchange", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("durationchange", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  /* =========================
     SAVE HISTORY
  ========================= */
  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: videoRef.current.currentTime,
          updatedAt: Date.now()
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box
        ref={containerRef}
        {...bindGestures()}
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
          controls={false}
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `brightness(${brightness}%)`
          }}
        />

        {/* SEEK INDICATOR */}
        <AnimatePresence>
          {showSeekIndicator && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: "50%",
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: "bold"
              }}
            >
              {seekDirection === "forward" ? "+10" : "-10"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* WAVEFORM */}
        <AnimatePresence>
          {waveformBars.length > 0 && (
            <motion.div
              style={{
                position: "absolute",
                bottom: "25%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 4
              }}
            >
              {waveformBars.map((bar) => (
                <motion.div
                  key={bar.id}
                  initial={{ height: 0 }}
                  animate={{ height: bar.height }}
                  exit={{ height: 0 }}
                  transition={{ delay: bar.delay }}
                  style={{
                    width: 4,
                    background: "#ff4081",
                    borderRadius: 2
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
