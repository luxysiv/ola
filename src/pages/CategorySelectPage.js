// src/pages/CategorySelectPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Select, MenuItem } from "@mui/material";

function CategorySelectPage() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("https://phimapi.com/the-loai")
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Chọn thể loại
      </Typography>
      <Select
        fullWidth
        value=""
        onChange={e => navigate(`/the-loai/${e.target.value}`)}
      >
        <MenuItem value="">--Chọn thể loại--</MenuItem>
        {categories.map(c => (
          <MenuItem key={c._id} value={c.slug}>
            {c.name}
          </MenuItem>
        ))}
      </Select>
    </Container>
  );
}

export default CategorySelectPage;
