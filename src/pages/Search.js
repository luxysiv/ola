// src/pages/Search.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // gọi API tìm kiếm
  const handleSearch = async (pageNum = 1) => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/tim-kiem?keyword=${keyword}&page=${pageNum}`
      );
      setResults(res.data.data.items || []);
      setTotalPages(res.data.data.params.pagination.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // gợi ý khi gõ
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (keyword.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(
          `https://phimapi.com/v1/api/tim-kiem?keyword=${keyword}`
        );
        const items = res.data.data.items || [];
        setSuggestions(items.map((m) => m.name));
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(delayDebounce);
  }, [keyword]);

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" gap={2} justifyContent="center" mb={3}>
        <Autocomplete
          freeSolo
          options={suggestions}
          inputValue={keyword}
          onInputChange={(e, newValue) => setKeyword(newValue)}
          sx={{ width: "60%" }}
          renderInput={(params) => (
            <TextField {...params} label="Nhập tên phim..." variant="outlined" />
          )}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSearch(1)}
          sx={{ px: 4 }}
        >
          Tìm
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {results.map((movie) => (
              <Grid item xs={12} sm={6} md={3} key={movie._id}>
                <Card
                  sx={{
                    transition: "transform 0.3s",
                    "&:hover": { transform: "scale(1.05)" }
                  }}
                >
                  <Link to={`/phim/${movie.slug}`} style={{ textDecoration: "none" }}>
                    <CardMedia
                      component="img"
                      height="300"
                      image={`https://phimimg.com/${movie.poster_url}`}
                      alt={movie.name}
                    />
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        textAlign="center"
                        color="text.primary"
                      >
                        {movie.name}
                      </Typography>
                    </CardContent>
                  </Link>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => handleSearch(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default Search;
