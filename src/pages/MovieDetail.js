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
  const [searchParams, setSearchParams] =
    useSearchParams();

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

        const svSlug =
          searchParams.get("sv");
        const epSlug =
          searchParams.get("ep");

        if (!svSlug) return;

        const svIndex = epData.findIndex(
          s =>
            normalize(s.server_name) ===
            svSlug
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
  }, [slug]);

  const episodeList =
    servers[currentServer]
      ?.server_data || [];

  const banner =
    movie?.thumb_url ||
    movie?.poster_url;
  
  const handleSelectEpisode = (
    ep,
    index
  ) => {
    setSrc(ep.link_m3u8);
    setCurrentEp(ep.name);

    setSearchParams({
      sv: normalize(
        servers[currentServer]
          .server_name
      ),
      ep: normalize(ep.name)
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleChangeServer = index => {
    setCurrentServer(index);
    setSrc(null);
    setCurrentEp(null);

    setSearchParams({
      sv: normalize(
        servers[index].server_name
      )
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
            <Chip
              label={
                movie.episode_current
              }
            />
          </Stack>

          <Typography sx={{ mt: 2 }}>
            {movie.content}
          </Typography>

          <Typography sx={{ mt: 2 }}>
            <b>Diễn viên:</b>{" "}
            {movie.actor?.join(", ")}
          </Typography>

          <Typography>
            <b>Thể loại:</b>{" "}
            {movie.category
              ?.map(c => c.name)
              .join(", ")}
          </Typography>
        </>
      )}

      {/* Server */}
      <Typography
        sx={{ mt: 3 }}
        variant="h6"
      >
        Server
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
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
      </Stack>

      {/* Danh sách tập */}
      <Typography
        sx={{ mt: 3 }}
        variant="h6"
      >
        Danh sách tập
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
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
