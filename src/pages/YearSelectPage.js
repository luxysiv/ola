// src/pages/YearSelectPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, TextField } from "@mui/material";

function YearSelectPage() {
  const navigate = useNavigate();
  const [year, setYear] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && year) {
      navigate(`/nam/${year}`);
    }
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Nhập năm phát hành
      </Typography>

      <TextField
        fullWidth
        label="Nhập năm (ví dụ: 2024)"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        onKeyDown={handleKeyDown}
        type="number"
      />
    </Container>
  );
}

export default YearSelectPage;
