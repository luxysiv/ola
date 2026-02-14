import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import { Container, Typography, Button, Box, Chip, Stack } from "@mui/material";

const normalize = (str = "") =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[()#]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

function MovieDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef(null); // Để cuộn xuống khi xem

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
  HÀM LƯU LỊCH SỬ (CÓ FULL PATH)
  ========================= */
  const saveToHistory = (movieData, serverName, epName) => {
    const history = JSON.parse(localStorage.getItem("watch_history") || "[]");
    const svSlug = normalize(serverName);
    const epSlug = normalize(epName);
    
    // Lưu link đầy đủ để từ trang chủ bấm vào là xem tiếp được luôn
    const fullPath = `/phim/${slug}?${svSlug}&${epSlug}`;

    const newItem = {
      id: movieData._id,
      name: movieData.name,
      slug: slug,
      fullPath: fullPath,
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
  Load dữ liệu và xử lý URL
  ========================= */
  useEffect(() => {
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];
        setMovie(movieData);
        setServers(epData);

        const parts = getQueryParts();
        const serverSlug = parts[0];
        const epSlug = parts[1];

        if (serverSlug) {
          const svIndex = epData.findIndex(s => normalize(s.server_name) === serverSlug);
          if (svIndex !== -1) {
            setCurrentServer(svIndex);
            if (epSlug) {
              const ep = epData[svIndex].server_data.find(e => normalize(e.name) === epSlug);
              if (ep) {
                setSrc(ep.link_m3u8);
                setCurrentEp(ep.name);
                saveToHistory(movieData, epData[svIndex].server_name, ep.name);
                // Tự động cuộn xuống trình phát sau 500ms
                setTimeout(() => playerRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);
              }
            }
          }
        }
      })
      .catch(console.error);
  }, [slug, location.search]);

  const episodeList = servers[currentServer]?.server_data || [];

  const handleSelectEpisode = (ep) => {
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);
    const svName = servers[currentServer].server_name;
    saveToHistory(movie, svName, ep.name);
    navigate(`/phim/${slug}?${normalize(svName)}&${normalize(ep.name)}`);
  };

  const handleChangeServer = (index) => {
    setCurrentServer(index);
    const svName = servers[index].server_name;
    
    // Nếu đang xem 1 tập, hãy thử tìm tập đó ở server mới
    if (currentEp) {
      const sameEp = servers[index].server_data.find(e => e.name === currentEp);
      if (sameEp) {
        setSrc(sameEp.link_m3u8);
        saveToHistory(movie, svName, currentEp);
        navigate(`/phim/${slug}?${normalize(svName)}&${normalize(currentEp)}`);
        return;
      }
    }
    setSrc(null);
    setCurrentEp(null);
    navigate(`/phim/${slug}?${normalize(svName)}`);
  };

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      <div ref={playerRef}>
        {src ? (
          <VideoPlayer src={src} />
        ) : (
          <Box sx={{ width: "100%", height: 400, bgcolor: "black", borderRadius: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="white">Chọn tập phim để xem</Typography>
          </Box>
        )}
      </div>

      {movie && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" fontWeight="bold">{movie.name}</Typography>
          <Stack direction="row" spacing={1} mt={1}>
            <Chip label={movie.year} color="primary" />
            <Chip label={movie.quality} />
            <Chip label={movie.lang} />
          </Stack>
          <Typography sx={{ mt: 2, color: "text.secondary" }}>{movie.content}</Typography>
        </Box>
      )}

      <Typography sx={{ mt: 4 }} variant="h6">Server</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
        {servers.map((sv, i) => (
          <Button key={i} variant={i === currentServer ? "contained" : "outlined"} onClick={() => handleChangeServer(i)}>
            {sv.server_name}
          </Button>
        ))}
      </Box>

      <Typography sx={{ mt: 4 }} variant="h6">Danh sách tập</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 1, mt: 1 }}>
        {episodeList.map((ep, i) => (
          <Button key={i} variant={currentEp === ep.name ? "contained" : "outlined"} onClick={() => handleSelectEpisode(ep)}>
            {ep.name}
          </Button>
        ))}
      </Box>
    </Container>
  );
}

export default MovieDetail;
