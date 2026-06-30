import React, { useState, useEffect, useContext } from "react";
import {
  AppBar, Toolbar, IconButton, Typography, Drawer,
  List, ListItemText, ListItemButton, Divider, Box,
  Collapse, TextField, Button, Menu, MenuItem,
  useMediaQuery, InputAdornment, Tooltip, alpha
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HistoryIcon from "@mui/icons-material/History";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ColorModeContext } from "../index";

const NAV_ITEMS = [
  { label: "Thể loại", key: "category" },
  { label: "Quốc gia", key: "country" },
  { label: "Loại phim", key: "type" },
  { label: "Năm", key: "year" },
];

const typeList = [
  { slug: "phim-bo", name: "Phim Bộ" },
  { slug: "phim-le", name: "Phim Lẻ" },
  { slug: "tv-shows", name: "TV Shows" },
  { slug: "hoat-hinh", name: "Hoạt Hình" },
  { slug: "phim-vietsub", name: "Vietsub" },
  { slug: "phim-thuyet-minh", name: "Thuyết Minh" },
  { slug: "phim-long-tieng", name: "Lồng Tiếng" },
];

function Header() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const { toggleColorMode, mode } = useContext(ColorModeContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchor, setAnchor] = useState({ category: null, country: null, year: null, type: null });
  const [expanded, setExpanded] = useState({});
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [yearInput, setYearInput] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    axios.get("https://phimapi.com/the-loai").then((r) => setCategories(r.data || [])).catch(() => {});
    axios.get("https://phimapi.com/quoc-gia").then((r) => setCountries(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openMenu = (key, e) => setAnchor((a) => ({ ...a, [key]: e.currentTarget }));
  const closeMenu = (key) => setAnchor((a) => ({ ...a, [key]: null }));

  const goNav = (path) => {
    navigate(path);
    Object.keys(anchor).forEach(closeMenu);
    setDrawerOpen(false);
  };

  const goToYear = () => {
    if (yearInput) { goNav(`/nam/${yearInput}`); setYearInput(""); }
  };

  const menuItems = { category: categories, country: countries, type: typeList };
  const menuPaths = {
    category: (c) => `/the-loai/${c.slug}`,
    country: (c) => `/quoc-gia/${c.slug}`,
    type: (t) => `/danh-sach/${t.slug}`,
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0, zIndex: 1200,
          bgcolor: scrolled
            ? alpha(theme.palette.background.paper, 0.92)
            : theme.palette.background.paper,
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: "background 0.3s, backdrop-filter 0.3s",
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ color: "text.primary" }}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box
            onClick={() => navigate("/")}
            sx={{
              display: "flex", alignItems: "center", gap: 0.6,
              cursor: "pointer", userSelect: "none", flexGrow: isDesktop ? 0 : 1,
            }}
          >
            <LocalFireDepartmentIcon sx={{ color: "primary.main", fontSize: 26 }} />
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "text.primary" }}
            >
              Hdo<Box component="span" sx={{ color: "primary.main" }}>phim</Box>
            </Typography>
          </Box>

          {/* Desktop Nav */}
          {isDesktop && (
            <Box sx={{ display: "flex", gap: 0.5, ml: 3, flex: 1 }}>
              <Button color="inherit" onClick={() => navigate("/phim-moi-cap-nhat")}
                sx={{ fontWeight: 500, color: "text.primary", "&:hover": { color: "primary.main" } }}>
                Phim mới
              </Button>
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.key}
                  color="inherit"
                  onClick={(e) => openMenu(item.key, e)}
                  endIcon={<ExpandMore sx={{ fontSize: 16, opacity: 0.6 }} />}
                  sx={{ fontWeight: 500, color: "text.primary", "&:hover": { color: "primary.main" } }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Right actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto" }}>
            <Tooltip title="Tìm kiếm">
              <IconButton onClick={() => navigate("/tim-kiem")} sx={{ color: "text.primary" }}>
                <SearchIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Lịch sử xem">
              <IconButton onClick={() => navigate("/lich-su")} sx={{ color: "text.primary" }}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={mode === "dark" ? "Chế độ sáng" : "Chế độ tối"}>
              <IconButton onClick={toggleColorMode} sx={{ color: "text.primary" }}>
                {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Desktop Dropdown Menus */}
      {["category", "country", "type"].map((key) => (
        <Menu
          key={key}
          anchorEl={anchor[key]}
          open={Boolean(anchor[key])}
          onClose={() => closeMenu(key)}
          slotProps={{
            paper: {
              sx: {
                mt: 1, maxHeight: 420, width: 220,
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              },
            },
          }}
        >
          {menuItems[key]?.map((item) => (
            <MenuItem
              key={item._id || item.slug}
              onClick={() => goNav(menuPaths[key](item))}
              sx={{ fontSize: 14, "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
            >
              {item.name}
            </MenuItem>
          ))}
        </Menu>
      ))}

      {/* Year menu */}
      <Menu
        anchorEl={anchor.year}
        open={Boolean(anchor.year)}
        onClose={() => closeMenu("year")}
        slotProps={{ paper: { sx: { mt: 1, p: 1, bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}` } } }}
      >
        <Box sx={{ p: 1, display: "flex", gap: 1 }}>
          <TextField
            size="small" type="number" placeholder="VD: 2024"
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goToYear()}
            InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: "text.secondary", fontSize: 13 }}>Năm</InputAdornment> }}
            sx={{ width: 140 }}
          />
          <Button variant="contained" size="small" onClick={goToYear} color="primary">Xem</Button>
        </Box>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: "background.default", borderRight: `1px solid ${theme.palette.divider}` } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LocalFireDepartmentIcon sx={{ color: "primary.main", fontSize: 22 }} />
            <Typography fontWeight={800} sx={{ color: "text.primary" }}>
              Hdo<Box component="span" sx={{ color: "primary.main" }}>phim</Box>
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        <List disablePadding>
          <ListItemButton onClick={() => goNav("/phim-moi-cap-nhat")} sx={{ py: 1.5, px: 2 }}>
            <LocalFireDepartmentIcon sx={{ mr: 1.5, fontSize: 18, color: "primary.main" }} />
            <ListItemText primary="Phim mới cập nhật" primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
          </ListItemButton>
          <Divider />

          {[
            { key: "category", label: "Thể loại", items: categories, path: (c) => `/the-loai/${c.slug}` },
            { key: "country", label: "Quốc gia", items: countries, path: (c) => `/quoc-gia/${c.slug}` },
            { key: "type", label: "Loại phim", items: typeList, path: (t) => `/danh-sach/${t.slug}` },
          ].map(({ key, label, items, path }) => (
            <React.Fragment key={key}>
              <ListItemButton onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))} sx={{ py: 1.5, px: 2 }}>
                <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
                {expanded[key] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </ListItemButton>
              <Collapse in={expanded[key]}>
                <Box sx={{ maxHeight: 220, overflowY: "auto", bgcolor: "background.paper" }}>
                  {items.map((item) => (
                    <ListItemButton key={item._id || item.slug} onClick={() => goNav(path(item))} sx={{ pl: 4, py: 0.8 }}>
                      <ListItemText primary={item.name} primaryTypographyProps={{ fontSize: 13, color: "text.secondary" }} />
                    </ListItemButton>
                  ))}
                </Box>
              </Collapse>
              <Divider />
            </React.Fragment>
          ))}

          {/* Year mobile */}
          <ListItemButton onClick={() => setExpanded((e) => ({ ...e, year: !e.year }))} sx={{ py: 1.5, px: 2 }}>
            <ListItemText primary="Năm phát hành" primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }} />
            {expanded.year ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </ListItemButton>
          <Collapse in={expanded.year}>
            <Box sx={{ p: 2, display: "flex", gap: 1 }}>
              <TextField fullWidth size="small" type="number" placeholder="VD: 2024"
                value={yearInput} onChange={(e) => setYearInput(e.target.value)} />
              <Button variant="contained" onClick={goToYear} size="small">Xem</Button>
            </Box>
          </Collapse>
        </List>
      </Drawer>
    </>
  );
}

export default Header;
