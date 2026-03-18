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
  const [cdnImage, setCdnImage] = useState("");

  const [seo, setSeo] = useState({
    title: "",
    description: "",
    image: ""
  });

  // =========================
  // HELPER IMAGE (FIX CHUẨN)
  // =========================
  const buildImageUrl = (url) => {
    if (!url) return "/no-image.jpg";

    // Nếu đã có http
    if (url.startsWith("http")) return url;

    // remove "/" đầu nếu có
    const cleanUrl = url.replace(/^\/+/, "");

    return cdnImage ? `${cdnImage}/${cleanUrl}` : "/no-image.jpg";
  };

  // =========================
  // SEARCH API
  // =========================
  const handleSearch = useCallback(async (pageNum, kw, shouldNavigate = true) => {
    if (!kw?.trim()) return;

    setLoading(true);

    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(kw)}&page=${pageNum}`
      );

      const data = res.data.data;

      setResults(data.items || []);
      setCdnImage(data.APP_DOMAIN_CDN_IMAGE || "");

      setTotalPages(data.params?.pagination?.totalPages || 1);

      setSeo({
        title: data.titlePage || `Kết quả: ${kw}`,
        description: data.seoOnPage?.descriptionHead || "",
        image: data.seoOnPage?.og_image?.[0] || ""
      });

      if (shouldNavigate) {
        navigate(`/tim-kiem?tu-khoa=${encodeURIComponent(kw)}&trang=${pageNum}`);
      }

    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // =========================
  // LOAD URL
  // =========================
  useEffect(() => {
    if (queryKeyword) {
      handleSearch(currentPage, queryKeyword, false);
      setKeyword(queryKeyword);
    }
  }, [queryKeyword, currentPage]);

  // =========================
  // AUTOCOMPLETE
  // =========================
  useEffect(() => {
    const fetchSuggest = async () => {
      if (keyword.length < 2) return setSuggestions([]);

      try {
        const res = await axios.get(
          `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`
        );

        const items = res.data.data.items || [];

        setSuggestions(items.slice(0, 5).map((i) => i.name));
      } catch {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggest, 400);
    return () => clearTimeout(debounce);
  }, [keyword]);

  // =========================
  // SEO IMAGE FIX
  // =========================
  const getSeoImage = () => {
    if (!seo.image) return "";

    if (seo.image.startsWith("http")) return seo.image;

    const clean = seo.image.replace(/^\/+/, "");

    return cdnImage ? `${cdnImage}/${clean}` : "";
  };

  // =========================
  // EVENTS
  // =========================
  const onSearch = () => {
    if (keyword.trim()) {
      handleSearch(1, keyword);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onPageChange = (e, page) => {
    handleSearch(page, queryKeyword);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================
  // RENDER
  // =========================
  return (
    <Container sx={{ mt: 4 }}>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        {getSeoImage() && <meta property="og:image" content={getSeoImage()} />}
      </Helmet>

      {/* SEARCH */}
      <Box display="flex" gap={1} mb={4}>
        <Autocomplete
          freeSolo
          options={suggestions}
          inputValue={keyword}
          onInputChange={(e, val) => setKeyword(val)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          sx={{ flex: 1 }}
          renderInput={(params) => (
            <TextField {...params} label="Tìm phim..." size="small" />
          )}
        />

        <Button variant="contained" onClick={onSearch}>
          Tìm
        </Button>
      </Box>

      {/* LOADING */}
      {loading ? (
        <Box textAlign="center" mt={10}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {results.map((movie) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={movie._id}>
                <Card>
                  <Link to={`/phim/${movie.slug}`}>
                    <CardMedia
                      component="img"
                      height="280"
                      image={buildImageUrl(movie.poster_url || movie.thumb_url)}
                      alt={movie.name}
                      onError={(e) => (e.target.src = "/no-image.jpg")}
                    />
                  </Link>

                  <CardContent>
                    <Typography variant="subtitle2" noWrap>
                      {movie.name}
                    </Typography>
                    <Typography variant="caption">
                      {movie.year} • {movie.quality}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <Box mt={4} display="flex" justifyContent="center">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={onPageChange}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default Search;
