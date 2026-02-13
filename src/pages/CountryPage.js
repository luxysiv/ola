// src/pages/CountryPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";

import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Box,
  Pagination
} from "@mui/material";

function CountryPage() {
  const { country } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // đọc page từ URL
  useEffect(() => {
    const pg = parseInt(searchParams.get("trang") || "1", 10);
    handleFetch(pg);
  }, [country]);

  const handleFetch = async (pageNum = 1) => {
    if (!country) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/quoc-gia/${country}?page=${pageNum}`
      );

      const data = res.data.data;

      setMovies(data.items || []);
      setTotalPages(data.params?.pagination?.totalPages || 1);
      setPage(pageNum);

      // update URL
      navigate(`/quoc-gia/${country}?trang=${pageNum}`, {
        replace: false
      });

    } catch (error) {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Quốc gia: {country}
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {movies.map(m => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={m._id}>
                <Card
                  sx={{
                    transition: "transform 0.3s",
                    "&:hover": { transform: "scale(1.05)" }
                  }}
                >
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

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => handleFetch(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default CountryPage;
