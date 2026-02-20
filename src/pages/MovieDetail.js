import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import VideoPlayer from "../components/VideoPlayer";
import { getHistory } from "../utils/history";
import { Container, Typography, Button, Box, Chip, Stack } from "@mui/material";

const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

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

  useEffect(() => {
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];
        setMovie(movieData);
        setServers(epData);

        const history = getHistory();
        const historyItem = history.find(m => m.slug === slug);
        if (historyItem) setResumeTime(historyItem.currentTime || 0);

        const searchPath = location.search.substring(1);
        const parts = searchPath.split("&").filter(Boolean);

        // NẾU CÓ QUERY -> HIỆN PLAYER
        if (parts.length > 0) {
          let serverSlug = parts[0];
          let epSlug = parts[1];

          let svIdx = epData.findIndex(s => normalize(s.server_name) === serverSlug);
          if (svIdx === -1) svIdx = 0;
          setCurrentServer(svIdx);

          const listEp = epData[svIdx]?.server_data || [];
          let epIdx = listEp.findIndex(e => normalize(e.name) === epSlug);
          if (epIdx === -1) epIdx = 0;

          if (listEp[epIdx]) {
            setSrc(listEp[epIdx].link_m3u8);
            setCurrentEp(listEp[epIdx].name);
          }
        } else {
          // KHÔNG QUERY -> HIỆN BANNER
          setSrc(null);
          setCurrentEp(null);
        }
      })
      .catch(console.error);
  }, [slug, location.search]);

  const handleSelectEpisode = (ep) => {
    const svSlug = normalize(servers[currentServer]?.server_name);
    const epSlug = normalize(ep.name);
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const episodeList = servers[currentServer]?.server_data || [];
  const banner = movie?.thumb_url || movie?.poster_url;

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {movie && (
        <Helmet>
          <title>
            {currentEp 
              ? `Đang xem: ${movie.name} - ${currentEp} | KKPhim` 
              : `${movie.name} (${movie.year}) | KKPhim`}
          </title>
        </Helmet>
      )}

      {src ? (
        <VideoPlayer
          key={src}
          src={src}
          title={`${movie?.name} - ${currentEp}`}
          movieInfo={{
            slug,
            name: movie?.name,
            poster: movie?.poster_url,
            episode: currentEp,
            server: servers[currentServer]?.server_name
          }}
          resumeTime={resumeTime}
        />
      ) : (
        banner && (
          <Box sx={{ 
            width: "100%", height: 450, backgroundImage: `url(${banner})`, 
            backgroundSize: "cover", backgroundPosition: "center", borderRadius: 2, mb: 2,
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
          }}>
             <Box sx={{ position: 'absolute', top:0, left:0, right:0, bottom:0, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }} />
             <Button variant="contained" size="large" color="error" sx={{ zIndex: 1 }} onClick={() => handleSelectEpisode(episodeList[0])}>
               XEM PHIM NGAY
             </Button>
          </Box>
        )
      )}

      {/* Thông tin phim */}
      {movie && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" fontWeight="bold">{movie.name}</Typography>
          <Typography color="gray">{movie.origin_name}</Typography>
          <Stack direction="row" spacing={1} mt={1} mb={2}>
            <Chip label={movie.quality} color="primary" />
            <Chip label={movie.lang} />
            <Chip label={movie.year} />
          </Stack>
          <Typography variant="body1">{movie.content?.replace(/<[^>]*>/g, "")}</Typography>
        </Box>
      )}

      {/* Danh sách tập */}
      <Typography sx={{ mt: 4 }} variant="h6">Danh sách tập</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 1, mt: 1 }}>
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
