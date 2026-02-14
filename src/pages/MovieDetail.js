import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import { Container, Typography, Button, Box, Chip, Stack } from "@mui/material";

/* =========================
Chuẩn hóa URL latin
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

  const getQueryParts = () => {
    if (!location.search) return [];
    return location.search.substring(1).split("&").filter(Boolean);
  };

  /* =========================
  Lưu lịch sử vào localStorage
  ========================= */
  const saveToHistory = (movieData, serverName, epName) => {
    const history = JSON.parse(localStorage.getItem("watch_history") || "[]");
    const newItem = {
      id: movieData._id,
      name: movieData.name,
      slug: slug,
      poster: movieData.poster_url || movieData.thumb_url,
      server: serverName,
      episode: epName,
      time: new Date().getTime()
    };
    const filtered = history.filter(item => item.slug !== slug);
    const updated = [newItem, ...filtered].slice(0, 20);
    localStorage.setItem("watch_history", JSON.stringify(updated));
  };

  /* =========================
  Load dữ liệu phim
  ========================= */
  useEffect(() => {
    axios
      .get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];
        setMovie(movieData);
        setServers(epData);

        const parts = getQueryParts();
        const serverSlug = parts[0];
        const epSlug = parts[1];

        if (!serverSlug) return;

        const svIndex = epData.findIndex(s => normalize(s.server_name) === serverSlug);
        if (svIndex === -1) return;
        setCurrentServer(svIndex);

        if (!epSlug) return;
        const ep = epData[svIndex].server_data.find(e => normalize(e.name) === epSlug);

        if (ep) {
          setCurrentEp(ep.name);
          setSrc(ep.link_m3u8);
          // Lưu lịch sử khi load từ URL có sẵn
          saveToHistory(movieData, epData[svIndex].server_name, ep.name);
        }
      })
      .catch(console.error);
  }, [slug, location.search]);

  const episodeList = servers[currentServer]?.server_data || [];
  const banner = movie?.thumb_url || movie?.poster_url;

  /* =========================
  Chọn tập
  ========================= */
  const handleSelectEpisode = ep => {
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);
    const svName = servers[currentServer].server_name;
    
    saveToHistory(movie, svName, ep.name);

    const svSlug = normalize(svName);
    const epSlug = normalize(ep.name);
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* =========================
  Đổi server (Giữ tập đang xem)
  ========================= */
  const handleChangeServer = index => {
    setCurrentServer(index);
    const svName = servers[index].server_name;
    const svSlug = normalize(svName);

    // Tìm tập phim hiện tại ở server mới
    if (currentEp) {
      const epInNewServer = servers[index].server_data.find(e => e.name === currentEp);
      if (epInNewServer) {
        setSrc(epInNewServer.link_m3u8);
        saveToHistory(movie, svName, currentEp);
        navigate(`/phim/${slug}?${svSlug}&${normalize(currentEp)}`);
        return;
      }
    }

    setSrc(null);
    setCurrentEp(null);
    navigate(`/phim/${slug}?${svSlug}`);
  };

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {src ? (
        <VideoPlayer src={src} />
      ) : (
        banner && (
          <Box
            sx={{
              width: "100%", height: 450,
              backgroundImage: `url(${banner})`,
              backgroundSize: "cover", backgroundPosition: "center",
              borderRadius: 2, mb: 2
            }}
          />
        )
      )}

      {movie && (
        <>
          <Typography variant="h4" fontWeight="bold">{movie.name}</Typography>
          <Typography color="gray">{movie.origin_name}</Typography>
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            <Chip label={movie.year} />
            <Chip label={movie.quality} />
            <Chip label={movie.lang} />
            <Chip label={movie.time} />
          </Stack>
          <Typography sx={{ mt: 2 }}>{movie.content}</Typography>
        </>
      )}

      <Typography sx={{ mt: 3 }} variant="h6">Server</Typography>
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

      <Typography sx={{ mt: 3 }} variant="h6">Danh sách tập</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 1, mt: 1 }}>
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
