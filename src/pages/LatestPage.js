import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
} from "@mui/material";

function LatestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Lấy số trang hiện tại từ URL (?trang=x)
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const handleFetch = useCallback(async (pageNum) => {
    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=${pageNum}`
      );

      // Lưu ý: Cấu trúc JSON của phim-moi-cap-nhat-v3 nằm trực tiếp ở res.data
      const items = res.data.items || [];
      const pagination = res.data.pagination || {};

      setMovies(items);
      setTotalPages(pagination.totalPages || 1);
    } catch (error) {
      console.error("Lỗi fetch API Phim mới:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi API mỗi khi số trang thay đổi
  useEffect(() => {
    handleFetch(currentPage);
  }, [currentPage, handleFetch]);

  const handlePageChange = (event, value) => {
    // Điều hướng URL để useEffect kích hoạt lại
    navigate(`/phim-moi-cap-nhat?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 3, mb: 5 }}>
      <Helmet>
        <title>{`Phim Mới Cập Nhật - Trang ${currentPage} | KKPhim`}</title>
        <meta name="description" content="Danh sách phim mới cập nhật bản đẹp, vietsub nhanh nhất." />
      </Helmet>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        🔥 Phim mới cập nhật (Trang {currentPage})
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 10, mb: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {movies.length > 0 ? (
              movies.map((m) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={m._id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.3s",
                      "&:hover": { transform: "scale(1.03)", boxShadow: 6 },
                    }}
                  >
                    <Link to={`/phim/${m.slug}`} style={{ textDecoration: "none" }}>
                      <CardMedia
                        component="img"
                        height="280"
                        // Kiểm tra nếu poster_url là link tuyệt đối thì dùng luôn, không thì nối domain
                        image={
                          m.poster_url?.startsWith("http")
                            ? m.poster_url
                            : `https://phimimg.com/${m.poster_url}`
                        }
                        alt={m.name}
                        sx={{ objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = "/no-image.jpg";
                        }}
                      />
                    </Link>

                    <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: "bold",
                          height: 40,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          color: "text.primary",
                        }}
                      >
                        {m.name}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        {m.year} • {m.quality} • {m.episode_current || "Full"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography align="center">Không tìm thấy phim nào.</Typography>
              </Grid>
            )}
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

export default LatestPage;
