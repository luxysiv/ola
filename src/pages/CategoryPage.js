// src/pages/CategoryPage.js
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

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // load danh sách thể loại
  useEffect(() => {
    axios.get("https://phimapi.com/the-loai")
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  // load phim theo thể loại
  useEffect(() => {
    if (!category) return;

    setLoading(true);

    axios
      .get(`https://phimapi.com/v1/api/the-loai/${category}?page=1`)
      .then(res => {
        setMovies(res.data.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Thể loại: {category}
      </Typography>

      {/* Dropdown chọn thể loại */}
      <Select
        fullWidth
        value={category || ""}
        onChange={e =>
          navigate(`/the-loai/${e.target.value}`)
        }
      >
        <MenuItem value="">--Chọn thể loại--</MenuItem>

        {categories.map(c => (
          <MenuItem key={c._id} value={c.slug}>
            {c.name}
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
              <Link to={`/phim/${m.slug}`}>
                <CardMedia
                  component="img"
                  height="250"
                  image={`https://phimimg.com/${m.poster_url}`}
                />
              </Link>

              <CardContent>
                <Typography variant="body2">
                  {m.name}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
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

export default CategoryPage;
