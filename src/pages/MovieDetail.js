import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  useParams,
  useSearchParams
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

function MovieDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] =
    useState(0);
  const [src, setSrc] = useState(null);
  const [currentEp, setCurrentEp] =
    useState(null);

  // Load phim
  useEffect(() => {
    axios
      .get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];

        setMovie(movieData);
        setServers(epData);

        // đọc URL
        const sv =
          parseInt(searchParams.get("sv")) || 0;
        const epIndex =
          parseInt(searchParams.get("ep"));

        if (
          epData[sv] &&
          epData[sv].server_data[epIndex]
        ) {
          const ep =
            epData[sv].server_data[epIndex];

          setCurrentServer(sv);
          setCurrentEp(ep.name);
          setSrc(ep.link_m3u8);
        }
      })
      .catch(console.error);
  }, [slug]);

  const episodeList =
    servers[currentServer]?.server_data || [];

  const banner =
    movie?.thumb_url || movie?.poster_url;

  // chọn tập
  const handleSelectEpisode = (ep, index) => {
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);

    setSearchParams({
      sv: currentServer,
      ep: index
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // đổi server
  const handleChangeServer = (index) => {
    setCurrentServer(index);
    setSrc(null);
    setCurrentEp(null);

    setSearchParams({
      sv: index
    });
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
              backgroundPosition: "center",
              borderRadius: 2,
              mb: 2
            }}
          />
        )
      )}

      {/* Info */}
      {movie && (
        <>
          <Typography variant="h4" fontWeight="bold">
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
            <Chip label={movie.episode_current} />
          </Stack>

          <Typography sx={{ mt: 2 }}>
            {movie.content}
          </Typography>
        </>
      )}

      {/* Server */}
      <Typography sx={{ mt: 3 }} variant="h6">
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
            onClick={() =>
              handleSelectEpisode(ep, i)
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
