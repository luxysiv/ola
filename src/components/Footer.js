// src/components/Footer.js
import React from "react";
import { Box, Typography, Container } from "@mui/material";

function Footer() {
  return (
    <Box
      sx={(theme) => ({
        mt: 4,
        py: 3,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.secondary,
        textAlign: "center",
        borderTop: `1px solid ${theme.palette.divider}`
      })}
    >
      <Container>
        <Typography variant="body2">
          © {new Date().getFullYear()} Hdophim
        </Typography>

        <Typography variant="body2">
          Xem phim trực tuyến chất lượng cao.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
