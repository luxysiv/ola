//src/pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Box
} from "@mui/material";

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1")
      .then(res => {
        setMovies(res.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        🔥 Phim mới cập nhật
      </Typography>

      {loading && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {movies.map(m => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={m._id}>
            <Card>
              <Link to={`/movie/${m.slug}`}>
                <CardMedia
                  component="img"
                  height="250"
                  image={
                    m.poster_url?.startsWith("http")
                      ? m.poster_url
                      : `https://phimimg.com/${m.poster_url}`
                  }
                  onError={(e) => {
                    e.target.src = "/no-image.jpg";
                  }}
                />
              </Link>
              <CardContent>
                <Typography variant="body2">{m.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {m.year} • {m.quality}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Home;
