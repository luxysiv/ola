// src/pages/CountryPage.js
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

function CountryPage() {
  const { country } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);

  // load danh sách quốc gia
  useEffect(() => {
    axios.get("https://phimapi.com/quoc-gia")
      .then(res => setCountries(res.data || []))
      .catch(() => setCountries([]));
  }, []);

  // load phim theo quốc gia
  useEffect(() => {
    if (!country) return;

    setLoading(true);

    axios
      .get(`https://phimapi.com/v1/api/quoc-gia/${country}?page=1`)
      .then(res => {
        setMovies(res.data.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [country]);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Quốc gia: {country}
      </Typography>

      {/* Dropdown chọn quốc gia */}
      <Select
        fullWidth
        value={country || ""}
        onChange={e =>
          navigate(`/country/${e.target.value}`)
        }
      >
        <MenuItem value="">--Chọn quốc gia--</MenuItem>

        {countries.map(c => (
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
              <Link to={`/movie/${m.slug}`}>
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

export default CountryPage;
