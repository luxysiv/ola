import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  useParams,
  useNavigate
} from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

import {
  Container,
  Typography,
  Button,
  Stack,
  Box,
  Chip
} from "@mui/material";

/* Chuẩn hóa URL */
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
  const {
    slug,
    server,
    episode
  } = useParams();

  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] =
    useState(0);
  const [src, setSrc] = useState(null);
  const [currentEp, setCurrentEp] =
    useState(null);

  useEffect(() => {
    axios
      .get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];

        setMovie(movieData);
        setServers(epData);

        if (!server) return;

        const svIndex = epData.findIndex(
          s =>
            normalize(s.server_name) ===
            server
        );

        if (svIndex === -1) return;

        setCurrentServer(svIndex);

        if (!episode) return;

        const epIndex =
          epData[
            svIndex
          ].server_data.findIndex(
            e =>
              normalize(e.name) ===
              episode
          );

        if (epIndex === -1) return;

        const ep =
          epData[svIndex]
            .server_data[epIndex];

        setCurrentEp(ep.name);
        setSrc(ep.link_m3u8);
      })
      .catch(console.error);
  }, [slug, server, episode]);

  const episodeList =
    servers[currentServer]
      ?.server_data || [];

  const banner =
    movie?.thumb_url ||
    movie?.poster_url;

  /* chọn tập */
  const handleSelectEpisode = ep => {
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);

    navigate(
      `/phim/${slug}/${normalize(
        servers[currentServer]
          .server_name
      )}/${normalize(ep.name)}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* đổi server */
  const handleChangeServer = index => {
    setCurrentServer(index);
    setSrc(null);
    setCurrentEp(null);

    navigate(
      `/phim/${slug}/${normalize(
        servers[index].server_name
      )}`
    );
  };

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {/* Banner / Player */}
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

      {/* Server */}
      <Typography sx={{ mt: 3 }}>
        Server
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
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
      </Stack>

      {/* Episode */}
      <Typography sx={{ mt: 3 }}>
        Danh sách tập
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
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
      </Stack>
    </Container>
  );
}

export default MovieDetail;
