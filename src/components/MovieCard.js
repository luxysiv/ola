import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Tooltip, IconButton } from "@mui/material";

export const getPosterUrl = (url, cdn = "") => {
  if (!url) return "/no-image.jpg";
  if (url.startsWith("http")) return url;
  if (cdn) return `${cdn}/${url.replace(/^\/+/, "")}`;
  return `https://phimimg.com/${url}`;
};

/**
 * Unified movie poster card used across Home, LatestPage, Search,
 * CategoryPage, CountryPage, TypeListPage, YearPage, HistoryPage.
 *
 * Fixed aspect ratio (2:3) keeps every grid perfectly aligned,
 * regardless of column count or container width.
 */
export default function MovieCard({
  movie,
  to,
  cdn = "",
  badgeText,       // top-right badge, e.g. quality "FHD"
  bottomBadge,     // bottom-left badge, e.g. episode_current
  episodeLabel,    // for history: "Đang xem: Tập 5" replaces year/quality line
  onDelete,        // for history: shows a delete button, top-left
  subtitle,        // custom subtitle override (defaults to year • quality)
}) {
  const poster = getPosterUrl(movie.poster_url || movie.poster || movie.thumb_url, cdn);
  const quality = badgeText ?? movie.quality;
  const bottomLabel = bottomBadge ?? (movie.episode_current && movie.episode_current !== "Full" ? movie.episode_current : null);

  return (
    <Box sx={{ width: "100%" }}>
      <Link to={to} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <Box
          sx={{
            position: "relative",
            borderRadius: 2,
            overflow: "hidden",
            width: "100%",
            aspectRatio: "2 / 3",
            bgcolor: "background.paper",
            transition: "transform 0.2s",
            "&:hover": { transform: "translateY(-4px)" },
            "&:hover .mc-overlay": { opacity: 1 },
          }}
        >
          <Box
            component="img"
            src={poster}
            alt={movie.name}
            loading="lazy"
            onError={(e) => { e.target.src = "/no-image.jpg"; }}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />

          {/* Hover overlay with play icon */}
          <Box
            className="mc-overlay"
            sx={{
              position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.2s",
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <PlayCircleFilledIcon sx={{ color: "#fff", fontSize: { xs: 36, sm: 44 } }} />
          </Box>

          {/* Quality badge top-right */}
          {quality && (
            <Box sx={{
              position: "absolute", top: 6, right: 6,
              bgcolor: "primary.main", color: "#fff",
              fontSize: 10, fontWeight: 700, px: 0.8, py: 0.2, borderRadius: 1,
              lineHeight: 1.6,
            }}>
              {quality}
            </Box>
          )}

          {/* Bottom strip badge (episode info) */}
          {bottomLabel && (
            <Box sx={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              bgcolor: "rgba(0,0,0,0.75)", color: "#fff",
              fontSize: 11, fontWeight: 600, px: 1, py: 0.5, textAlign: "center",
            }}>
              {bottomLabel}
            </Box>
          )}

          {/* Delete button (history page) */}
          {onDelete && (
            <Tooltip title="Xóa mục này">
              <IconButton
                size="small"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                sx={{
                  position: "absolute", top: 4, left: 4, zIndex: 2,
                  bgcolor: "rgba(0,0,0,0.55)", color: "#fff",
                  width: 28, height: 28,
                  "&:hover": { bgcolor: "error.main" },
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Title + subtitle */}
        <Box sx={{ pt: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              fontSize: 13, lineHeight: 1.4,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              minHeight: "2.8em",
            }}
          >
            {movie.name}
          </Typography>
          {episodeLabel ? (
            <Typography variant="caption" sx={{ color: "primary.main", fontSize: 11, fontWeight: 600 }}>
              {episodeLabel}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
              {subtitle ?? [movie.year, movie.quality || movie.lang].filter(Boolean).join(" • ")}
            </Typography>
          )}
        </Box>
      </Link>
    </Box>
  );
}
