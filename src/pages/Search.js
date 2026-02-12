// src/pages/Search.js
import React, { useState } from "react";
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
  Box,
  CircularProgress
} from "@mui/material";

function Search() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://phimapi.com/v1/api/tim-kiem?keyword=${keyword}`
      );
      setResults(res.data.data.items || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" textAlign="center">
        🎬 Tìm kiếm phim
      </Typography>

      <Box display="flex" gap={2} justifyContent="center" mb={3}>
        <TextField
          label="Nhập tên phim..."
          variant="outlined"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ width: "60%" }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
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
      )}
    </Container>
  );
}

export default Search;
