//src/components/VideoPlayer.js
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = src;
      }
    }
  }, [src]);

  return <video ref={videoRef} controls style={{ width: "100%" }} />;
};

export default VideoPlayer;
