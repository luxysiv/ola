// src/pages/YearSelectPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Select, MenuItem } from "@mui/material";

const years = Array.from({ length: 26 }, (_, i) => 2000 + i);

function YearSelectPage() {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Chọn năm phát hành
      </Typography>
      <Select
        fullWidth
        value=""
        onChange={e => navigate(`/year/${e.target.value}`)}
      >
        <MenuItem value="">--Chọn năm--</MenuItem>
        {years.map(y => (
          <MenuItem key={y} value={y}>
            {y}
          </MenuItem>
        ))}
      </Select>
    </Container>
  );
}

export default YearSelectPage;
