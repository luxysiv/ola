//src/components/Footer.js
import React from "react";
import { Box, Typography, Container } from "@mui/material";

function Footer() {
  return (
    <Box
      sx={{
        mt: 4,
        py: 3,
        backgroundColor: "#111",
        color: "#aaa",
        textAlign: "center"
      }}
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
