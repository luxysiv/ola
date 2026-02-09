//src/pages/MovieDetail.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

import {
  Container,
  Typography,
  Button,
  Stack
} from "@mui/material";

function MovieDetail() {
  const { slug } = useParams();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        setMovie(res.data.movie);
        setServers(res.data.episodes);

        const first =
          res.data.episodes?.[0]?.server_data?.[0];

        if (first) setSrc(first.link_m3u8);
      });
  }, [slug]);

  const episodeList =
    servers[currentServer]?.server_data || [];

  return (
    <Container sx={{ mt: 2 }}>
      {movie && (
        <>
          <Typography variant="h5">
            {movie.name}
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            {movie.origin_name}
          </Typography>
        </>
      )}

      {src && <VideoPlayer src={src} />}

      <Typography sx={{ mt: 2 }}>
        Server
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {servers.map((sv, i) => (
          <Button
            key={i}
            variant="outlined"
            onClick={() => {
              setCurrentServer(i);
              setSrc(sv.server_data[0].link_m3u8);
            }}
          >
            {sv.server_name}
          </Button>
        ))}
      </Stack>

      <Typography sx={{ mt: 2 }}>
        Danh sách tập
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {episodeList.map((ep, i) => (
          <Button
            key={i}
            variant="contained"
            onClick={() => setSrc(ep.link_m3u8)}
          >
            {ep.name}
          </Button>
        ))}
      </Stack>
    </Container>
  );
}

export default MovieDetail;
