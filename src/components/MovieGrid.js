import React from "react";
import { Box, Skeleton, Typography } from "@mui/material";

/**
 * Shared responsive grid for movie poster cards.
 * Same column breakpoints everywhere => cards always line up identically
 * across Home, LatestPage, Search, CategoryPage, CountryPage, TypeListPage,
 * YearPage, and HistoryPage.
 */
const COLUMNS = {
  xs: "repeat(2, 1fr)",
  sm: "repeat(3, 1fr)",
  md: "repeat(4, 1fr)",
  lg: "repeat(5, 1fr)",
  xl: "repeat(6, 1fr)",
};

export default function MovieGrid({ children, loading, skeletonCount = 18, emptyMessage }) {
  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.5, sm: 2 },
          gridTemplateColumns: COLUMNS,
        }}
      >
        {[...Array(skeletonCount)].map((_, i) => (
          <Box key={i}>
            <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "2 / 3", borderRadius: 2 }} animation="wave" />
            <Skeleton variant="text" sx={{ mt: 1 }} animation="wave" />
            <Skeleton variant="text" width="60%" animation="wave" />
          </Box>
        ))}
      </Box>
    );
  }

  const hasChildren = React.Children.count(children) > 0;

  if (!hasChildren) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="text.secondary">{emptyMessage || "Không tìm thấy phim nào."}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: COLUMNS,
      }}
    >
      {children}
    </Box>
  );
}
