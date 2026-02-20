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

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  
  // Lấy số trang hiện tại từ URL, mặc định là 1
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const [seoData, setSeoData] = useState({
    titleHead: "",
    descriptionHead: "",
    titlePage: ""
  });

  const handleFetch = useCallback(async (pageNum) => {
    if (!category) return;
    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/the-loai/${category}?page=${pageNum}`
      );

      const responseData = res.data.data;

      setMovies(responseData.items || []);
      setTotalPages(responseData.params?.pagination?.totalPages || 1);
      
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
  }, [category]);

  // Theo dõi sự thay đổi của category hoặc số trang trên URL
  useEffect(() => {
    handleFetch(currentPage);
  }, [currentPage, handleFetch]);

  const handlePageChange = (event, value) => {
    // Đẩy số trang lên URL
    navigate(`/the-loai/${category}?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 3, mb: 5 }}>
      <Helmet>
        {/* Tiêu đề sẽ hiển thị: "Phim Hành Động | Trang 2 | KKPhim" */}
        <title>{`${seoData.titlePage || 'Thể loại'} - Trang ${currentPage} | KKPhim`}</title>
        <meta name="description" content={seoData.descriptionHead} />
      </Helmet>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold", mb: 3 }}>
        Thể loại: {seoData.titlePage} (Trang {currentPage})
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 10, mb: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
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
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination
                count={totalPages}
                page={currentPage} // Đồng bộ số trang với URL
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
