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
  Pagination
} from "@mui/material";

function CountryPage() {
  const { country } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  
  // Lấy số trang hiện tại từ URL (?trang=x)
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  // Lưu thông tin SEO từ API
  const [seoData, setSeoData] = useState({
    titleHead: "",
    descriptionHead: "",
    titlePage: ""
  });

  const handleFetch = useCallback(async (pageNum) => {
    if (!country) return;
    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/quoc-gia/${country}?page=${pageNum}`
      );

      const responseData = res.data.data;

      setMovies(responseData.items || []);
      setTotalPages(responseData.params?.pagination?.totalPages || 1);
      
      // Lấy data từ đúng cấu trúc JSON: data.seoOnPage và data.titlePage
      setSeoData({
        titleHead: responseData.seoOnPage?.titleHead || "",
        descriptionHead: responseData.seoOnPage?.descriptionHead || "",
        titlePage: responseData.titlePage || ""
      });

    } catch (error) {
      console.error("Lỗi fetch API Quốc gia:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [country]);

  // Gọi API mỗi khi country hoặc số trang thay đổi
  useEffect(() => {
    handleFetch(currentPage);
  }, [currentPage, handleFetch]);

  const handlePageChange = (event, value) => {
    // Điều hướng URL để useEffect kích hoạt lại
    navigate(`/quoc-gia/${country}?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 3, mb: 5 }}>
      <Helmet>
        {/* Tiêu đề hiển thị chuẩn SEO kèm số trang */}
        <title>{`${seoData.titlePage || 'Quốc gia'} - Trang ${currentPage} | KKPhim`}</title>
        <meta name="description" content={seoData.descriptionHead} />
      </Helmet>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Quốc gia: {seoData.titlePage} (Trang {currentPage})
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
                        // Phimimg.com kết hợp với poster_url từ API
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
                          color: 'text.primary'
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

export default CountryPage;
