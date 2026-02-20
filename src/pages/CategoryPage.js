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
  
  // Lưu thông tin SEO từ API
  const [seoData, setSeoData] = useState({
    titleHead: "",
    descriptionHead: "",
    titlePage: ""
  });

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

      const responseData = res.data.data;

      // Cập nhật danh sách phim và phân trang
      setMovies(responseData.items || []);
      setTotalPages(responseData.params?.pagination?.totalPages || 1);
      setPage(pageNum);
      
      // Cập nhật dữ liệu SEO từ API dựa trên cấu trúc JSON bạn gửi
      setSeoData({
        titleHead: responseData.seoOnPage?.titleHead || "",
        descriptionHead: responseData.seoOnPage?.descriptionHead || "",
        titlePage: responseData.titlePage || ""
      });

    } catch (error) {
      console.error("Lỗi fetch API:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    navigate(`/the-loai/${category}?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 3, mb: 5 }}>
      {/* Helmet sử dụng dữ liệu chính xác từ JSON API */}
      <Helmet>
        <title>{`${seoData.titleHead} ${page > 1 ? `- Trang ${page}` : ""}`}</title>
        <meta name="description" content={seoData.descriptionHead} />
      </Helmet>

      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'gray' }}>Trang chủ</Link>
        <Typography color="text.primary">Thể loại</Typography>
        <Typography color="text.primary" sx={{ fontWeight: 'bold' }}>{seoData.titlePage}</Typography>
      </Breadcrumbs>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
        Thể loại: {seoData.titlePage}
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 10, mb: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {movies.map((m) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={m._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: "transform 0.3s",
                    "&:hover": { transform: "scale(1.03)", boxShadow: 6 }
                  }}
                >
                  <Link to={`/phim/${m.slug}`} style={{ textDecoration: 'none' }}>
                    <CardMedia
                      component="img"
                      height="280"
                      // Sử dụng APP_DOMAIN_CDN_IMAGE từ API nếu có, hoặc fix cứng phimimg.com
                      image={`https://phimimg.com/${m.poster_url}`}
                      alt={m.name}
                      sx={{ objectFit: 'cover' }}
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
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {m.name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      {m.year} • {m.quality} • {m.lang}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default CategoryPage;
