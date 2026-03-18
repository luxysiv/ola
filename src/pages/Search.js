import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Container,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Pagination,
  Autocomplete,
  CircularProgress,
  Box
} from "@mui/material";

function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Lấy từ khóa và trang từ URL
  const queryKeyword = searchParams.get("tu-khoa") || "";
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const [keyword, setKeyword] = useState(queryKeyword);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // SEO Data
  const [seoTitle, setSeoTitle] = useState("Tìm kiếm phim");

  const handleSearch = useCallback(async (pageNum, kw) => {
    if (!kw || !kw.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(kw)}&page=${pageNum}`
      );
      const data = res.data.data;
      setResults(data.items || []);
      setTotalPages(data.params?.pagination?.totalPages || 1);
      setSeoTitle(data.titlePage || `Kết quả tìm kiếm: ${kw}`);
      
      // Đồng bộ URL
      navigate(`/tim-kiem?tu-khoa=${encodeURIComponent(kw)}&trang=${pageNum}`);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Trigger tìm kiếm khi URL thay đổi (nhấn nút Tìm hoặc chuyển trang)
  useEffect(() => {
    if (queryKeyword) {
      handleSearch(currentPage, queryKeyword);
      setKeyword(queryKeyword); // Giữ text trong ô input đúng với URL
    }
  }, [queryKeyword, currentPage, handleSearch]);

  // Gợi ý khi gõ (Debounce)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (keyword.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(
          `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`
        );
        const items = res.data.data.items || [];
        setSuggestions(items.map((m) => m.name));
      } catch (error) {
        setSuggestions([]);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(delayDebounce);
  }, [keyword]);

  const onSearchClick = () => {
    if (keyword.trim()) {
      handleSearch(1, keyword);
    }
  };

  const handlePageChange = (event, value) => {
    handleSearch(value, queryKeyword);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container sx={{ mt: 4, mb: 5 }}>
      <Helmet>
        <title>{`${seoTitle} ${currentPage > 1 ? `- Trang ${currentPage}` : ""}`}</title>
      </Helmet>

      <Box display="flex" gap={1} justifyContent="center" mb={4}>
        <Autocomplete
          freeSolo
          options={suggestions}
          inputValue={keyword}
          onInputChange={(e, newValue) => setKeyword(newValue)}
          onKeyPress={(e) => e.key === 'Enter' && onSearchClick()}
          sx={{ width: "70%" }}
          renderInput={(params) => (
            <TextField {...params} label="Nhập tên phim cần tìm..." variant="outlined" size="small" />
          )}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={onSearchClick}
          sx={{ px: 3 }}
        >
          Tìm
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {queryKeyword && (
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              {seoTitle} (Trang {currentPage})
            </Typography>
          )}

          <Grid container spacing={2}>
            {results.length > 0 ? (
              results.map((movie) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={movie._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: "transform 0.3s",
                      "&:hover": { transform: "scale(1.03)", boxShadow: 6 }
                    }}
                  >
                    <Link to={`/phim/${movie.slug}`} style={{ textDecoration: "none" }}>
                      <CardMedia
                        component="img"
                        height="280"
                        image={`https://phimimg.com/${movie.poster_url}`}
                        alt={movie.name}
                        sx={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.src = "/no-image.jpg"; }}
                      />
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'bold',
                            color: 'text.primary',
                            height: 40,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {movie.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          {movie.year} • {movie.quality}
                        </Typography>
                      </CardContent>
                    </Link>
                  </Card>
                </Grid>
              ))
            ) : queryKeyword && !loading ? (
              <Box sx={{ width: '100%', textAlign: 'center', mt: 5 }}>
                <Typography color="text.secondary">Không tìm thấy phim nào phù hợp với từ khóa.</Typography>
              </Box>
            ) : null}
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

export default Search;
