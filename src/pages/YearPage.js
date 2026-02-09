//src/pages/YearPage.js
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

const years = Array.from({ length: 26 }, (_, i) => 2000 + i);

function YearPage() {
  const { year } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year) return;
    setLoading(true);

    axios
      .get(`https://phimapi.com/v1/api/nam/${year}?page=1`)
      .then(res => {
        setMovies(res.data?.data?.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Năm phát hành: {year}
      </Typography>

      <Select
        fullWidth
        value={year || ""}
        onChange={e => navigate(`/year/${e.target.value}`)}
      >
        <MenuItem value="">--Chọn năm--</MenuItem>
        {years.map(y => (
          <MenuItem key={y} value={y}>
            {y}
          </MenuItem>
        ))}
      </Select>

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
                  image={`https://phimimg.com/${m.poster_url}`}
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

export default YearPage;
