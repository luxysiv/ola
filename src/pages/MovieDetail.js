import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

import {
  Container,
  Typography,
  Button,
  Stack,
  Box,
  Chip
} from "@mui/material";

function MovieDetail() {
  const { slug } = useParams();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);
  const [src, setSrc] = useState(null);
  const [currentEp, setCurrentEp] = useState(null);

  useEffect(() => {
    axios
      .get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        setMovie(res.data.movie);
        setServers(res.data.episodes || []);
        setSrc(null); // không auto play
        setCurrentEp(null);
      })
      .catch(console.error);
  }, [slug]);

  const episodeList =
    servers[currentServer]?.server_data || [];

  const banner =
    movie?.thumb_url || movie?.poster_url;

  const handleSelectEpisode = (ep) => {
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 2, mb: 5 }}>

      {/* ===== Banner / Player ===== */}
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
              backgroundPosition: "center",
              borderRadius: 2,
              mb: 2
            }}
          />
        )
      )}

      {/* ===== Info phim ===== */}
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
            <Chip label={movie.episode_current} />
          </Stack>

          <Typography sx={{ mt: 2 }}>
            {movie.content}
          </Typography>

          <Typography sx={{ mt: 2 }}>
            <b>Diễn viên:</b> {movie.actor?.join(", ")}
          </Typography>

          <Typography>
            <b>Thể loại:</b>{" "}
            {movie.category?.map(c => c.name).join(", ")}
          </Typography>
        </>
      )}

      {/* ===== Server ===== */}
      <Typography sx={{ mt: 3 }} variant="h6">
        Server
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {servers.map((sv, i) => (
          <Button
            key={i}
            variant={i === currentServer ? "contained" : "outlined"}
            onClick={() => {
              setCurrentServer(i);
              setSrc(null);
              setCurrentEp(null);
            }}
          >
            {sv.server_name}
          </Button>
        ))}
      </Stack>

      {/* ===== Episode ===== */}
      <Typography sx={{ mt: 3 }} variant="h6">
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
            onClick={() => handleSelectEpisode(ep)}
          >
            {ep.name}
          </Button>
        ))}
      </Stack>
    </Container>
  );
}

export default MovieDetail;
