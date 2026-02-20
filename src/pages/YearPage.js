import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Box,
  Pagination,
  Breadcrumbs
} from "@mui/material";

function YearPage() {
  const { year } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [seoData, setSeoData] = useState({ titleHead: `Phim năm ${year}`, titlePage: `Năm ${year}` });

  // Lấy trang hiện tại từ query params (?trang=x), mặc định là 1
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const fetchMovies = useCallback(async (pageNumber) => {
    if (!year) return;
    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/nam/${year}?page=${pageNumber}`
      );
      const data = res.data?.data;

      setMovies(data?.items || []);
      setTotalPages(data?.params?.pagination?.totalPages || 1);
      
      // Cập nhật thông tin SEO từ API
      if (data?.seoOnPage) {
        setSeoData({
          titleHead: data.seoOnPage.titleHead,
          titlePage: data.titlePage
        });
      }
    } catch (error) {
      console.error("Lỗi tải phim theo năm:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [year]);

  // Gọi lại API khi năm hoặc trang trên URL thay đổi
  useEffect(() => {
    fetchMovies(currentPage);
  }, [year, currentPage, fetchMovies]);

  const handlePageChange = (event, value) => {
    // Điều hướng URL, useEffect sẽ tự động nhận diện và fetch data
    navigate(`/nam/${year}?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 4, mb: 5 }}>
      <Helmet>
        <title>{`${seoData.titleHead} - Trang ${currentPage} | KKPhim`}</title>
      </Helmet>

      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>Trang chủ</Link>
        <Typography color="text.primary">Năm {year}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "primary.main" }}>
        Phim Phát Hành: {year}
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {movies.map((m) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={m._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.3s",
                    "&:hover": { transform: "scale(1.03)", boxShadow: 10 }
                  }}
                >
                  <Link to={`/phim/${m.slug}`} style={{ textDecoration: "none" }}>
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        height="280"
                        image={`https://phimimg.com/${m.poster_url}`}
                        alt={m.name}
                        sx={{ objectFit: "cover" }}
                        onError={(e) => { e.target.src = "/no-image.jpg"; }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          backgroundColor: "primary.main",
                          color: "white",
                          px: 1,
                          borderRadius: 1,
                          fontWeight: "bold"
                        }}
                      >
                        {m.quality}
                      </Typography>
                    </Box>

                    <CardContent sx={{ p: 1.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: "bold",
                          color: "text.primary",
                          height: 40,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {m.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                         {m.episode_current}
                      </Typography>
                    </CardContent>
                  </Link>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default YearPage;
