// src/pages/LatestPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

function LatestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const pg = parseInt(searchParams.get("trang") || "1", 10);
    fetchMovies(pg);
  }, []);

  const fetchMovies = async (pageNum = 1) => {
    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=${pageNum}`
      );

      const items = res.data.items || [];
      const pagination = res.data.pagination || {};

      setMovies(items);
      setTotalPages(pagination.totalPages || 1);
      setPage(pageNum);

      navigate(`/phim-moi-cap-nhat?trang=${pageNum}`, {
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
        🔥 Phim mới cập nhật
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

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => fetchMovies(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default LatestPage;
