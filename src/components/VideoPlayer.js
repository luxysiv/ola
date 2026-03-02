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
     MUTE TOGGLE
  ========================= */
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = prevVolume;
        setVolume(prevVolume);
        setIsMuted(false);
      } else {
        setPrevVolume(volume);
        videoRef.current.volume = 0;
        setVolume(0);
        setIsMuted(true);
      }
    }
  };

  /* =========================
     SEEK HANDLER
  ========================= */
  const handleSeek = (_, value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
    }
  };

  /* =========================
     VOLUME CHANGE
  ========================= */
  const handleVolumeChange = (_, value) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
    setIsMuted(value === 0);
  };

  /* =========================
     PLAYBACK SPEED
  ========================= */
  const changePlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSettings(false);
    }
  };

  /* =========================
     AUTO HIDE CONTROLS
  ========================= */
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      setShowSettings(false);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('mouseleave', () => setShowControls(true));

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseleave', () => setShowControls(true));
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

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

      onDrag: ({ first, last, movement: [, my], event }) => {
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
          if (videoRef.current) {
            videoRef.current.volume = newVolume;
          }
          setShowVolumeIndicator(true);
        }

        if (last) {
          setTimeout(() => {
            setShowBrightnessIndicator(false);
            setShowVolumeIndicator(false);
          }, 1000);
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
     RESUME TIME
  ========================= */
  useEffect(() => {
    if (!movieInfo?.currentTime || hasResumed.current) return;

    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      if (!hasResumed.current) {
        video.currentTime = movieInfo.currentTime;
        hasResumed.current = true;
      }
    };

    video.addEventListener("loadedmetadata", handleCanPlay);
    return () => video.removeEventListener("loadedmetadata", handleCanPlay);
  }, [movieInfo?.currentTime]);

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
    const handleEnded = () => {
      setIsPlaying(false);
      if (onVideoEnd) onVideoEnd();
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("durationchange", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("durationchange", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onVideoEnd]);

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

  /* =========================
     FORMAT TIME
  ========================= */
  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
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
          overflow: "hidden",
          cursor: showControls ? "auto" : "none"
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

        {/* PLAY/PAUSE CENTER INDICATOR */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0,0,0,0.6)",
                borderRadius: "50%",
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 15
              }}
            >
              <PlayArrow sx={{ fontSize: 48, color: "white" }} />
            </motion.div>
          )}
        </AnimatePresence>

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
                fontWeight: "bold",
                color: "white",
                border: "2px solid #ff4081",
                zIndex: 20
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                bottom: "25%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 4,
                zIndex: 10
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

        {/* VOLUME INDICATOR */}
        <AnimatePresence>
          {showVolumeIndicator && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              style={{
                position: "absolute",
                top: "50%",
                right: 20,
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                border: "1px solid #ff4081",
                zIndex: 25
              }}
            >
              {volume === 0 ? (
                <VolumeOff />
              ) : volume < 0.5 ? (
                <VolumeDown />
              ) : (
                <VolumeUp />
              )}
              <Typography variant="caption">{Math.round(volume * 100)}%</Typography>
              <Box sx={{ width: 40, height: 4, bgcolor: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                <Box sx={{ width: `${volume * 100}%`, height: "100%", bgcolor: "#ff4081", borderRadius: 2 }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BRIGHTNESS INDICATOR */}
        <AnimatePresence>
          {showBrightnessIndicator && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              style={{
                position: "absolute",
                top: "50%",
                left: 20,
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                border: "1px solid #ff4081",
                zIndex: 25
              }}
            >
              {brightness > 50 ? <BrightnessHigh /> : <BrightnessLow />}
              <Typography variant="caption">{Math.round(brightness)}%</Typography>
              <Box sx={{ width: 40, height: 4, bgcolor: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                <Box sx={{ width: `${(brightness - 20) / 130 * 100}%`, height: "100%", bgcolor: "#ff4081", borderRadius: 2 }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EPISODE INDICATOR */}
        <AnimatePresence>
          {showControls && currentEpisode && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "rgba(0,0,0,0.6)",
                padding: "4px 12px",
                borderRadius: 20,
                backdropFilter: "blur(5px)",
                zIndex: 30
              }}
            >
              <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {currentEpisode}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ZONE INDICATORS */}
        <AnimatePresence>
          {showControls && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "20%",
                  height: "100%",
                  background: "linear-gradient(90deg, rgba(255,64,129,0.2) 0%, transparent 100%)",
                  borderRight: "1px dashed rgba(255,64,129,0.3)",
                  pointerEvents: "none",
                  zIndex: 5
                }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "20%",
                  height: "100%",
                  background: "linear-gradient(-90deg, rgba(255,64,129,0.2) 0%, transparent 100%)",
                  borderLeft: "1px dashed rgba(255,64,129,0.3)",
                  pointerEvents: "none",
                  zIndex: 5
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ZONE LABELS */}
        <AnimatePresence>
          {showControls && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.5, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 10,
                  transform: "translateY(-50%) rotate(-90deg)",
                  color: "white",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                  zIndex: 6,
                  textShadow: "0 0 5px rgba(0,0,0,0.5)"
                }}
              >
                ĐỘ SÁNG
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.5, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%) rotate(90deg)",
                  color: "white",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                  zIndex: 6,
                  textShadow: "0 0 5px rgba(0,0,0,0.5)"
                }}
              >
                ÂM LƯỢNG
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* CONTROLS OVERLAY */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                padding: "12px 16px 8px",
                zIndex: 35
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* PROGRESS BAR */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: "0.7rem", minWidth: 35 }}>
                    {formatTime(currentTime)}
                  </Typography>
                  <Slider
                    value={currentTime}
                    max={duration || 100}
                    onChange={handleSeek}
                    sx={{
                      flex: 1,
                      color: "#ff4081",
                      height: 3,
                      padding: "3px 0",
                      "& .MuiSlider-thumb": {
                        width: 10,
                        height: 10,
                        "&:hover, &.Mui-focusVisible": {
                          boxShadow: "0 0 0 8px rgba(255,64,129,0.16)"
                        }
                      },
                      "& .MuiSlider-rail": {
                        bgcolor: "rgba(255,255,255,0.3)",
                        height: 3
                      },
                      "& .MuiSlider-track": {
                        height: 3,
                        border: "none"
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: "0.7rem", minWidth: 35 }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              {/* CONTROL BUTTONS */}
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
                <IconButton onClick={togglePlay} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                </IconButton>

                <IconButton onClick={() => handleDoubleTap("backward")} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  <Replay10 fontSize="small" />
                </IconButton>

                <IconButton onClick={() => handleDoubleTap("forward")} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  <Forward10 fontSize="small" />
                </IconButton>

                {onPrevEpisode && (
                  <IconButton onClick={onPrevEpisode} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                    <SkipPrevious fontSize="small" />
                  </IconButton>
                )}

                {onNextEpisode && (
                  <IconButton onClick={onNextEpisode} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                    <SkipNext fontSize="small" />
                  </IconButton>
                )}

                {/* VOLUME CONTROL */}
                <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 0.5, ml: 1 }}>
                  <IconButton onClick={toggleMute} sx={{ color: "white", p: 0.5 }}>
                    {volume === 0 ? (
                      <VolumeOff fontSize="small" />
                    ) : volume < 0.5 ? (
                      <VolumeDown fontSize="small" />
                    ) : (
                      <VolumeUp fontSize="small" />
                    )}
                  </IconButton>
                  <Box sx={{ width: 60 }}>
                    <Slider
                      value={volume}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={handleVolumeChange}
                      sx={{
                        color: "#ff4081",
                        height: 3,
                        "& .MuiSlider-thumb": { width: 8, height: 8 },
                        "& .MuiSlider-rail": { bgcolor: "rgba(255,255,255,0.3)", height: 3 },
                        "& .MuiSlider-track": { height: 3 }
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }} />

                {/* SETTINGS */}
                <Box sx={{ position: "relative" }}>
                  <IconButton
                    onClick={() => setShowSettings(!showSettings)}
                    sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}
                  >
                    <Settings fontSize="small" />
                  </IconButton>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: "absolute",
                          bottom: 40,
                          right: 0,
                          background: "rgba(0,0,0,0.95)",
                          borderRadius: 8,
                          padding: 8,
                          minWidth: 140,
                          border: "1px solid rgba(255,64,129,0.3)",
                          zIndex: 40
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "gray", px: 2, py: 1, display: "block" }}>
                          Tốc độ phát
                        </Typography>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <Box
                            key={speed}
                            onClick={() => changePlaybackSpeed(speed)}
                            sx={{
                              px: 2,
                              py: 0.8,
                              cursor: "pointer",
                              bgcolor: playbackSpeed === speed ? "#ff4081" : "transparent",
                              borderRadius: 1,
                              "&:hover": {
                                bgcolor: playbackSpeed === speed ? "#ff4081" : "#333"
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ color: "white", fontSize: "0.8rem" }}>
                              {speed === 1 ? "Bình thường" : `${speed}x`}
                            </Typography>
                          </Box>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* FULLSCREEN */}
                <IconButton onClick={toggleFullscreen} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                </IconButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
