import React from "react";
import { Box, Typography, Container, Link as MuiLink, Stack, Divider } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

function Footer() {
  return (
    <Box
      component="footer"
      sx={(theme) => ({
        mt: 6, py: 4,
        bgcolor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "center", sm: "flex-start" }} spacing={2}>
          <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: { xs: "center", sm: "flex-start" }, mb: 0.5 }}>
              <LocalFireDepartmentIcon sx={{ color: "primary.main", fontSize: 20 }} />
              <Typography fontWeight={800} variant="body1">
                Hdo<Box component="span" sx={{ color: "primary.main" }}>phim</Box>
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Xem phim trực tuyến chất lượng cao, miễn phí.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Dữ liệu từ{" "}
              <MuiLink href="https://phimapi.com" target="_blank" rel="noopener" sx={{ color: "primary.main" }}>
                phimapi.com
              </MuiLink>
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          © {new Date().getFullYear()} Hdophim. Chỉ dành cho mục đích học tập và giải trí.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
