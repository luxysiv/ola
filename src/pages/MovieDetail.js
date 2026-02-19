import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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

        // 1. Lấy lịch sử xem
        const history = getHistory();
        const historyItem = history.find(m => m.slug === slug);
        if (historyItem) setResumeTime(historyItem.currentTime || 0);

        // 2. Phân tích URL theo dạng ?server&tap
        // location.search ví dụ: "?ha-noi-vietsub&tap-01"
        const searchPath = location.search.substring(1); // bỏ dấu "?"
        const parts = searchPath.split("&").filter(Boolean);
        
        let serverSlug = parts[0] || (historyItem?.server ? normalize(historyItem.server) : null);
        let epSlug = parts[1] || (historyItem?.episode ? normalize(historyItem.episode) : null);

        // 3. Tìm Server Index
        let svIdx = epData.findIndex(s => normalize(s.server_name) === serverSlug);
        if (svIdx === -1) svIdx = 0;
        setCurrentServer(svIdx);

        // 4. Tìm Tập phim
        const listEp = epData[svIdx]?.server_data || [];
        let epIdx = listEp.findIndex(e => normalize(e.name) === epSlug);
        
        // Nếu không có epSlug (vào phim lần đầu) hoặc không tìm thấy tập, lấy tập 1
        if (epIdx === -1) epIdx = 0;

        if (listEp[epIdx]) {
          const targetEp = listEp[epIdx];
          setSrc(targetEp.link_m3u8);
          setCurrentEp(targetEp.name);
          
          // Cập nhật lại URL cho đẹp nếu URL đang trống (phòng trường hợp vào link gốc không có ?...)
          if (!searchPath && listEp[epIdx]) {
             const newSvSlug = normalize(epData[svIdx].server_name);
             const newEpSlug = normalize(targetEp.name);
             navigate(`/phim/${slug}?${newSvSlug}&${newEpSlug}`, { replace: true });
          }
        }
      })
      .catch(console.error);
  }, [slug, location.search]);

  const handleSelectEpisode = ep => {
    const svSlug = normalize(servers[currentServer]?.server_name);
    const epSlug = normalize(ep.name);
    // Điều hướng theo định dạng bạn muốn: /slug?server&tap
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChangeServer = index => {
    const svSlug = normalize(servers[index]?.server_name);
    navigate(`/phim/${slug}?${svSlug}`);
  };

  const episodeList = servers[currentServer]?.server_data || [];

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {src ? (
        <VideoPlayer
          key={src} // Quan trọng để reset trình phát khi đổi tập
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
        movie?.poster_url && <Box sx={{ width: "100%", height: 450, backgroundImage: `url(${movie.poster_url})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 2, mb: 2 }} />
      )}

      {/* ... Phần hiển thị thông tin phim giữ nguyên như code trước ... */}
      {movie && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" fontWeight="bold">{movie.name}</Typography>
          <Typography color="gray" gutterBottom>{movie.origin_name}</Typography>
          <Stack direction="row" spacing={1} mb={2}>
            <Chip label={movie.year} size="small" />
            <Chip label={movie.quality} color="primary" size="small" />
          </Stack>
          <Typography variant="body1">{movie.content}</Typography>
        </Box>
      )}

      <Typography sx={{ mt: 3 }} variant="h6">Server</Typography>
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        {servers.map((sv, i) => (
          <Button key={i} variant={i === currentServer ? "contained" : "outlined"} onClick={() => handleChangeServer(i)}>
            {sv.server_name}
          </Button>
        ))}
      </Box>

      <Typography sx={{ mt: 3 }} variant="h6">Danh sách tập</Typography>
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
