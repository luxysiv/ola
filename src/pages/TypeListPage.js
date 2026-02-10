// src/pages/TypeListPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";

import {
  Container,
  Typography,
  Select,
  MenuItem,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Box
} from "@mui/material";

function TypeListPage() {
  const { type_list } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [types] = useState([
    { slug: "phim-bo", name: "Phim Bộ" },
    { slug: "phim-le", name: "Phim Lẻ" },
    { slug: "tv-shows", name: "TV Shows" },
    { slug: "hoat-hinh", name: "Hoạt Hình" },
    { slug: "phim-vietsub", name: "Phim Vietsub" },
    { slug: "phim-thuyet-minh", name: "Phim Thuyết Minh" },
    { slug: "phim-long-tieng", name: "Phim Lồng Tiếng" }
  ]);
  const [loading, setLoading] = useState(false);

  // load phim theo type_list
  useEffect(() => {
    if (!type_list) return;

    setLoading(true);

    axios
      .get(`https://phimapi.com/v1/api/danh-sach/${type_list}?page=1`)
      .then(res => {
        setMovies(res.data.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [type_list]);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Danh sách: {type_list}
      </Typography>

      {/* Dropdown chọn loại phim */}
      <Select
        fullWidth
        value={type_list || ""}
        onChange={e =>
          navigate(`/list/${e.target.value}`)
        }
      >
        <MenuItem value="">--Chọn loại phim--</MenuItem>
        {types.map(t => (
          <MenuItem key={t.slug} value={t.slug}>
            {t.name}
          </MenuItem>
        ))}
      </Select>

      {/* Loading */}
      {loading && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Danh sách phim */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {movies.map(m => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={m._id}>
            <Card>
              <Link to={`/movie/${m.slug}`}>
                <CardMedia
                  component="img"
                  height="250"
                  image={`https://phimimg.com/${m.poster_url}`}
                  onError={(e) => {
                    e.target.src = "/no-image.jpg";
                  }}
                />
              </Link>

              <CardContent>
                <Typography variant="body2" noWrap>
                  {m.name}
                </Typography>
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

export default TypeListPage;
