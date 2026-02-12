import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  useParams,
  useNavigate,
  useLocation
} from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

import {
  Container,
  Typography,
  Button,
  Box,
  Chip,
  Stack
} from "@mui/material";

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
  const [currentServer, setCurrentServer] =
    useState(0);
  const [src, setSrc] = useState(null);
  const [currentEp, setCurrentEp] =
    useState(null);

  /* đọc ?server&episode */
  const getQueryParts = () => {
    if (!location.search) return [];
    return location.search
      .substring(1)
      .split("&")
      .filter(Boolean);
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

        const svIndex = epData.findIndex(
          s =>
            normalize(s.server_name) ===
            serverSlug
        );

        if (svIndex === -1) return;

        setCurrentServer(svIndex);

        if (!epSlug) return;

        const epIndex =
          epData[
            svIndex
          ].server_data.findIndex(
            e =>
              normalize(e.name) ===
              epSlug
          );

        if (epIndex === -1) return;

        const ep =
          epData[svIndex]
            .server_data[epIndex];

        setCurrentEp(ep.name);
        setSrc(ep.link_m3u8);
      })
      .catch(console.error);
  }, [slug, location.search]);

  const episodeList =
    servers[currentServer]
      ?.server_data || [];

  const banner =
    movie?.thumb_url ||
    movie?.poster_url;

  /* =========================
     Chọn tập
  ========================= */
  const handleSelectEpisode = ep => {
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);

    const svSlug = normalize(
      servers[currentServer]
        .server_name
    );
    const epSlug = normalize(ep.name);

    navigate(
      `/phim/${slug}?${svSlug}&${epSlug}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* =========================
     Đổi server
  ========================= */
  const handleChangeServer = index => {
    setCurrentServer(index);
    setSrc(null);
    setCurrentEp(null);

    const svSlug = normalize(
      servers[index].server_name
    );

    navigate(`/phim/${slug}?${svSlug}`);
  };

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {/* Banner hoặc Player */}
      {src ? (
        <VideoPlayer src={src} />
      ) : (
        banner && (
          <Box
            sx={{
              width: "100%",
              height: 450,
              backgroundImage: `url(${banner})`,
              backgroundSize: "cover",
              backgroundPosition:
                "center",
              borderRadius: 2,
              mb: 2
            }}
          />
        )
      )}

      {/* Thông tin phim */}
      {movie && (
        <>
          <Typography
            variant="h4"
            fontWeight="bold"
          >
            {movie.name}
          </Typography>

          <Typography color="gray">
            {movie.origin_name}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            mt={1}
            flexWrap="wrap"
          >
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

      {/* ===== Server ===== */}
      <Typography
        sx={{ mt: 3 }}
        variant="h6"
      >
        Server
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 1
        }}
      >
        {servers.map((sv, i) => (
          <Button
            key={i}
            variant={
              i === currentServer
                ? "contained"
                : "outlined"
            }
            onClick={() =>
              handleChangeServer(i)
            }
          >
            {sv.server_name}
          </Button>
        ))}
      </Box>

      {/* ===== Episode ===== */}
      <Typography
        sx={{ mt: 3 }}
        variant="h6"
      >
        Danh sách tập
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(90px, 1fr))",
          gap: 1,
          mt: 1
        }}
      >
        {episodeList.map((ep, i) => (
          <Button
            key={i}
            variant={
              currentEp === ep.name
                ? "contained"
                : "outlined"
            }
            onClick={() =>
              handleSelectEpisode(ep)
            }
          >
            {ep.name}
          </Button>
        ))}
      </Box>
    </Container>
  );
}

export default MovieDetail;
