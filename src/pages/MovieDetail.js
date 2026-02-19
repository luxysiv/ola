import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  useParams,
  useNavigate,
  useLocation
} from "react-router-dom";

import VideoPlayer from "../components/VideoPlayer";
import { getHistory } from "../utils/history";

import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  Stack
} from "@mui/material";

/* =========================
   Chuẩn hóa URL
========================= */
const normalize = (str = "") =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[()#]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

function MovieDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);
  const [src, setSrc] = useState(null);
  const [currentEp, setCurrentEp] = useState(null);
  const [resumeTime, setResumeTime] = useState(0);

  /* =========================
     Lấy params từ URL dạng ?server-slug&episode-slug
  ========================= */
  const getQueryParts = () => {
    if (!location.search) return [];
    return location.search
      .substring(1)
      .split("&")
      .filter(Boolean);
  };

  /* =========================
     Load phim
  ========================= */
  useEffect(() => {
    let isMounted = true;

    axios
      .get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        if (!isMounted) return;

        const movieData = res.data.movie;
        const epData = res.data.episodes || [];

        setMovie(movieData);
        setServers(epData);

        // Lấy thông tin từ URL
        const parts = getQueryParts();
        let serverSlugFromUrl = parts[0] || null;
        let epSlugFromUrl = parts[1] || null;

        // Lấy thông tin từ lịch sử
        const history = getHistory();
        const historyItem = history.find(m => m.slug === slug);
        
        // Lưu thời gian đã xem từ lịch sử
        if (historyItem) {
          setResumeTime(historyItem.currentTime || 0);
        }

        // Tạo slug từ history
        let serverSlugFromHistory = historyItem?.server ? normalize(historyItem.server) : null;
        let epSlugFromHistory = historyItem?.episode ? normalize(historyItem.episode) : null;

        // QUYẾT ĐỊNH SERVER: Ưu tiên URL > History > Server đầu tiên
        let targetServerIndex = -1;
        let targetServerSlug = serverSlugFromUrl || serverSlugFromHistory;

        if (targetServerSlug && epData.length > 0) {
          targetServerIndex = epData.findIndex(
            s => normalize(s.server_name) === targetServerSlug
          );
        }

        // Nếu không tìm thấy server theo slug, chọn server đầu tiên
        if (targetServerIndex === -1 && epData.length > 0) {
          targetServerIndex = 0;
          targetServerSlug = normalize(epData[0].server_name);
        }

        if (targetServerIndex !== -1) {
          setCurrentServer(targetServerIndex);

          // QUYẾT ĐỊNH TẬP: Ưu tiên URL > History > Tập đầu tiên của server
          const episodeList = epData[targetServerIndex]?.server_data || [];
          let targetEpSlug = epSlugFromUrl || epSlugFromHistory;
          let targetEpisode = null;

          if (targetEpSlug && episodeList.length > 0) {
            // Tìm tập theo slug
            const epIndex = episodeList.findIndex(
              e => normalize(e.name) === targetEpSlug
            );
            
            if (epIndex !== -1) {
              targetEpisode = episodeList[epIndex];
            }
          }

          // Nếu không tìm thấy tập theo slug, chọn tập đầu tiên
          if (!targetEpisode && episodeList.length > 0) {
            targetEpisode = episodeList[0];
            targetEpSlug = normalize(targetEpisode.name);
          }

          // Cập nhật state nếu tìm thấy tập
          if (targetEpisode) {
            setCurrentEp(targetEpisode.name);
            setSrc(targetEpisode.link_m3u8);

            // ĐỒNG BỘ URL: Đảm bảo URL luôn đúng định dạng
            const currentServerSlug = normalize(epData[targetServerIndex].server_name);
            const currentEpSlug = normalize(targetEpisode.name);
            
            // Chỉ update URL nếu cần thiết
            if (serverSlugFromUrl !== currentServerSlug || epSlugFromUrl !== currentEpSlug) {
              navigate(`/phim/${slug}?${currentServerSlug}&${currentEpSlug}`, { replace: true });
            }
          }
        }
      })
      .catch(error => {
        console.error("Error loading movie:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, location.search, navigate]);

  const episodeList = servers[currentServer]?.server_data || [];
  const banner = movie?.thumb_url || movie?.poster_url;

  /* =========================
     Chọn tập - ĐÃ SỬA LỖI
  ========================= */
  const handleSelectEpisode = (ep) => {
    // Cập nhật state ngay lập tức
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);
    // QUAN TRỌNG: Reset thời gian để không bị tua
    setResumeTime(0);

    // Tạo slug
    const svSlug = normalize(servers[currentServer].server_name);
    const epSlug = normalize(ep.name);

    // Điều hướng với đúng format
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);

    // Cuộn lên đầu
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* =========================
     Đổi server - ĐÃ SỬA LỖI
  ========================= */
  const handleChangeServer = (index) => {
    // Cập nhật server
    setCurrentServer(index);
    
    // Reset state
    setSrc(null);
    setCurrentEp(null);
    setResumeTime(0);

    // Tạo slug server
    const svSlug = normalize(servers[index].server_name);

    // Điều hướng với server mới (sẽ tự động chọn tập đầu tiên)
    navigate(`/phim/${slug}?${svSlug}`);

    // Cuộn lên đầu
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {src ? (
        <VideoPlayer
          src={src}
          title={movie?.name}
          movieInfo={{
            slug,
            name: movie?.name,
            poster: movie?.poster_url,
            episode: currentEp,
            server: servers[currentServer]?.server_name,
            currentTime: resumeTime
          }}
        />
      ) : (
        banner && (
          <Box
            sx={{
              width: "100%",
              height: 450,
              backgroundImage: `url(${banner})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 2,
              mb: 2
            }}
          />
        )
      )}

      {movie && (
        <>
          <Typography variant="h4" fontWeight="bold">
            {movie.name}
          </Typography>

          <Typography color="gray">
            {movie.origin_name}
          </Typography>

          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            <Chip label={movie.year} />
            <Chip label={movie.quality} />
            <Chip label={movie.lang} />
            <Chip label={movie.time} />
          </Stack>

          <Typography sx={{ mt: 2 }}>
            {movie.content}
          </Typography>
        </>
      )}

      <Typography sx={{ mt: 3 }} variant="h6">
        Server
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
        {servers.map((sv, i) => (
          <Button
            key={i}
            variant={i === currentServer ? "contained" : "outlined"}
            onClick={() => handleChangeServer(i)}
          >
            {sv.server_name}
          </Button>
        ))}
      </Box>

      <Typography sx={{ mt: 3 }} variant="h6">
        Danh sách tập
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: 1,
          mt: 1
        }}
      >
        {episodeList.map((ep, i) => (
          <Button
            key={i}
            variant={currentEp === ep.name ? "contained" : "outlined"}
            onClick={() => handleSelectEpisode(ep)}
          >
            {ep.name}
          </Button>
        ))}
      </Box>
    </Container>
  );
}

export default MovieDetail;
