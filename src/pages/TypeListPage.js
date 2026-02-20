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

function TypeListPage() {
  const { type_list } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [seoData, setSeoData] = useState({ titleHead: "Đang tải...", titlePage: "" });

  // Lấy trang hiện tại từ URL (mặc định là 1)
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const fetchMovies = useCallback(async (pageNumber) => {
    if (!type_list) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/danh-sach/${type_list}?page=${pageNumber}`
      );
      const data = res.data.data;

      setMovies(data.items || []);
      setTotalPages(data.params?.pagination?.totalPages || 1);
      setSeoData({
        titleHead: data.seoOnPage?.titleHead,
        titlePage: data.titlePage
      });
    } catch (error) {
      console.error("Lỗi lấy danh sách phim:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [type_list]);

  // Gọi API mỗi khi type_list hoặc currentPage trên URL thay đổi
  useEffect(() => {
    fetchMovies(currentPage);
  }, [type_list, currentPage, fetchMovies]);

  const handlePageChange = (event, value) => {
    // Cập nhật URL, useEffect sẽ tự động bắt được và gọi API qua currentPage
    navigate(`/danh-sach/${type_list}?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 4, mb: 5 }}>
      <Helmet>
        <title>{`${seoData.titleHead} - Trang ${currentPage} | KKPhim`}</title>
      </Helmet>

      {/* Breadcrumbs giúp người dùng biết mình đang ở đâu */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>Trang chủ</Link>
        <Typography color="text.primary">{seoData.titlePage}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold", color: "primary.main" }}>
        {seoData.titlePage}
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
                    "&:hover": { transform: "scale(1.03)", boxShadow: 10 },
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
                      {/* Nhãn hiển thị chất lượng phim đè lên ảnh */}
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          backgroundColor: "rgba(229, 9, 20, 0.9)",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: "bold"
                        }}
                      >
                        {m.quality}
                      </Typography>
                    </Box>

                    <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
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
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {m.year} • {m.episode_current}
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
                sx={{
                  "& .MuiPaginationItem-root": { fontWeight: "bold" }
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default TypeListPage;
