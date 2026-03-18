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

  const queryKeyword = searchParams.get("tu-khoa") || "";
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const [keyword, setKeyword] = useState(queryKeyword);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // SEO
  const [seo, setSeo] = useState({
    title: "Tìm kiếm phim",
    description: "",
    image: ""
  });

  // ============================
  // FETCH SEARCH
  // ============================
  const handleSearch = useCallback(async (pageNum, kw, shouldNavigate = true) => {
    if (!kw || !kw.trim()) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `https://ophim1.com/v1/api/tim-kiem?keyword=${encodeURIComponent(kw)}&page=${pageNum}`
      );

      const data = res.data.data;

      setResults(data.items || []);
      setTotalPages(
        Math.ceil((data.params?.pagination?.totalItems || 0) / 24)
      );

      // SEO
      setSeo({
        title: data.titlePage || `Kết quả: ${kw}`,
        description: data.seoOnPage?.descriptionHead || "",
        image: data.seoOnPage?.og_image?.[0] || ""
      });

      if (shouldNavigate) {
        navigate(`/tim-kiem?tu-khoa=${encodeURIComponent(kw)}&trang=${pageNum}`);
      }

    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ============================
  // LOAD FROM URL
  // ============================
  useEffect(() => {
    if (queryKeyword) {
      handleSearch(currentPage, queryKeyword, false);
      setKeyword(queryKeyword);
    }
  }, [queryKeyword, currentPage]);

  // ============================
  // SUGGESTION (DEBOUNCE)
  // ============================
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (keyword.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await axios.get(
          `https://ophim1.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`
        );

        const items = res.data.data.items || [];

        setSuggestions(
          items.slice(0, 5).map((m) => m.name) // limit 5
        );

      } catch {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(debounce);
  }, [keyword]);

  // ============================
  // EVENTS
  // ============================
  const onSearchClick = () => {
    if (keyword.trim()) {
      handleSearch(1, keyword);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePageChange = (event, value) => {
    handleSearch(value, queryKeyword);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================
  // RENDER
  // ============================
  return (
    <Container sx={{ mt: 4, mb: 5 }}>
      <Helmet>
        <title>{`${seo.title} ${currentPage > 1 ? `- Trang ${currentPage}` : ""}`}</title>
        <meta name="description" content={seo.description} />
        {seo.image && <meta property="og:image" content={`https://img.ophim.live/${seo.image}`} />}
      </Helmet>

      {/* SEARCH BAR */}
      <Box display="flex" gap={1} justifyContent="center" mb={4}>
        <Autocomplete
          freeSolo
          options={suggestions}
          inputValue={keyword}
          onInputChange={(e, newValue) => setKeyword(newValue)}
          onChange={(e, value) => {
            if (value) {
              setKeyword(value);
              handleSearch(1, value);
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && onSearchClick()}
          sx={{ width: "70%" }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Nhập tên phim..."
              variant="outlined"
              size="small"
            />
          )}
        />

        <Button variant="contained" onClick={onSearchClick}>
          Tìm
        </Button>
      </Box>

      {/* LOADING */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* TITLE */}
          {queryKeyword && (
            <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
              {seo.title} (Trang {currentPage})
            </Typography>
          )}

          {/* LIST */}
          <Grid container spacing={2}>
            {results.length > 0 ? (
              results.map((movie) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={movie._id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "0.3s",
                      "&:hover": { transform: "scale(1.03)", boxShadow: 6 }
                    }}
                  >
                    <Link to={`/phim/${movie.slug}`} style={{ textDecoration: "none" }}>
                      <CardMedia
                        component="img"
                        height="280"
                        image={`https://img.ophim.live/${movie.poster_url}`}
                        alt={movie.name}
                        sx={{ objectFit: "cover" }}
                        onError={(e) => (e.target.src = "/no-image.jpg")}
                      />

                      <CardContent sx={{ p: 1.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: "bold",
                            height: 40,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical"
                          }}
                        >
                          {movie.name}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {movie.year} • {movie.quality}
                        </Typography>
                      </CardContent>
                    </Link>
                  </Card>
                </Grid>
              ))
            ) : (
              queryKeyword && (
                <Box sx={{ width: "100%", textAlign: "center", mt: 5 }}>
                  <Typography color="text.secondary">
                    Không tìm thấy phim nào.
                  </Typography>
                </Box>
              )
            )}
          </Grid>

          {/* PAGINATION */}
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
