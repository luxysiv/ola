import React, { useState, useEffect } from "react";
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

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryName, setCategoryName] = useState(""); // Lưu tên thể loại có dấu từ API

  // Đọc page từ URL khi load trang hoặc khi thay đổi category
  useEffect(() => {
    const pg = parseInt(searchParams.get("trang") || "1", 10);
    handleFetch(pg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, searchParams]);

  const handleFetch = async (pageNum = 1) => {
    if (!category) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/the-loai/${category}?page=${pageNum}`
      );

      const data = res.data.data;

      setMovies(data.items || []);
      setTotalPages(data.params?.pagination?.totalPages || 1);
      setPage(pageNum);
      
      // Lấy tiêu đề tiếng Việt từ API (ví dụ: "Phim Hành Động")
      setCategoryName(data.titlePage || category);

    } catch (error) {
      console.error("Lỗi khi tải danh sách thể loại:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    // Điều hướng URL để useEffect lắng nghe searchParams và gọi lại API
    navigate(`/the-loai/${category}?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 3, mb: 5 }}>
      {/* Cấu hình tiêu đề trang linh hoạt */}
      <Helmet>
        <title>{`${categoryName} ${page > 1 ? `- Trang ${page}` : ""} | KKPhim`}</title>
        <meta name="description" content={`Danh sách phim thuộc thể loại ${categoryName} mới nhất, cập nhật liên tục tại KKPhim.`} />
      </Helmet>

      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'gray' }}>Trang chủ</Link>
        <Typography color="text.primary">Thể loại</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 'bold' }}>{categoryName}</Typography>
      </Breadcrumbs>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", textTransform: "capitalize" }}>
        Thể loại: {categoryName}
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 10, mb: 10 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Đang tải danh sách phim...</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {movies.length > 0 ? (
              movies.map((m) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={m._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: "transform 0.3s",
                      "&:hover": { 
                        transform: "scale(1.03)",
                        boxShadow: 6
                      }
                    }}
                  >
                    <Link to={`/phim/${m.slug}`} style={{ textDecoration: 'none' }}>
                      <CardMedia
                        component="img"
                        height="300"
                        image={`https://phimimg.com/${m.poster_url}`}
                        alt={m.name}
                        sx={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.src = "/no-image.jpg"; }}
                      />
                    </Link>

                    <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold', 
                          height: 40, 
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '20px'
                        }}
                      >
                        {m.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 1 }}
                      >
                        {m.year} • {m.quality}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography sx={{ textAlign: 'center', mt: 5 }}>Không tìm thấy phim nào trong thể loại này.</Typography>
              </Grid>
            )}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination
                count={totalPages}
                page={page}
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

export default CategoryPage;
