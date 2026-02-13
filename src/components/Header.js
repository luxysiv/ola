// src/components/Header.js
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Collapse,
  TextField,
  Button,
  useMediaQuery,
  Menu,
  MenuItem
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Header() {
  const [open, setOpen] = useState(false);

  // Drawer accordion states (mobile)
  const [openCategory, setOpenCategory] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openType, setOpenType] = useState(false);

  // Data
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [yearInput, setYearInput] = useState("");

  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width:900px)");

  // Desktop dropdown anchors
  const [anchorCategory, setAnchorCategory] = useState(null);
  const [anchorCountry, setAnchorCountry] = useState(null);
  const [anchorYear, setAnchorYear] = useState(null);
  const [anchorType, setAnchorType] = useState(null);

  useEffect(() => {
    axios.get("https://phimapi.com/the-loai")
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]));

    axios.get("https://phimapi.com/quoc-gia")
      .then(res => setCountries(res.data || []))
      .catch(() => setCountries([]));
  }, []);

  const toggleDrawer = () => setOpen(!open);

  const goToYear = (y) => {
    if (!y) return;
    navigate(`/nam/${y}`);
    // close drawer on mobile
    if (!isDesktop) toggleDrawer();
    // close desktop menu if open
    setAnchorYear(null);
    // clear input
    setYearInput("");
  };

  // generate years for dropdown (current year down to 1980)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 1980; y--) years.push(y);

  // static types
  const types = [
    { slug: "phim-bo", name: "Phim Bộ" },
    { slug: "phim-le", name: "Phim Lẻ" },
    { slug: "tv-shows", name: "TV Shows" },
    { slug: "hoat-hinh", name: "Hoạt Hình" },
    { slug: "phim-vietsub", name: "Phim Vietsub" },
    { slug: "phim-thuyet-minh", name: "Phim Thuyết Minh" },
    { slug: "phim-long-tieng", name: "Phim Lồng Tiếng" }
  ];

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#111", color: "#fff" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          {/* Left: logo and mobile menu icon */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {!isDesktop && (
              <IconButton color="inherit" edge="start" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              sx={{ cursor: "pointer", fontWeight: 700 }}
              onClick={() => navigate("/")}
            >
              Hdophim
            </Typography>
          </Box>

          {/* Center: desktop horizontal menu with dropdowns */}
          {isDesktop && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
              <Button
                color="inherit"
                onClick={(e) => setAnchorCategory(e.currentTarget)}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Thể loại
              </Button>
              <Menu
                anchorEl={anchorCategory}
                open={Boolean(anchorCategory)}
                onClose={() => setAnchorCategory(null)}
                MenuListProps={{ sx: { maxHeight: 320 } }}
              >
                {categories.length === 0 ? (
                  <MenuItem disabled>Không có dữ liệu</MenuItem>
                ) : (
                  categories.map(c => (
                    <MenuItem
                      key={c._id}
                      onClick={() => { navigate(`/the-loai/${c.slug}`); setAnchorCategory(null); }}
                    >
                      {c.name}
                    </MenuItem>
                  ))
                )}
              </Menu>

              <Button
                color="inherit"
                onClick={(e) => setAnchorCountry(e.currentTarget)}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Quốc gia
              </Button>
              <Menu
                anchorEl={anchorCountry}
                open={Boolean(anchorCountry)}
                onClose={() => setAnchorCountry(null)}
                MenuListProps={{ sx: { maxHeight: 320 } }}
              >
                {countries.length === 0 ? (
                  <MenuItem disabled>Không có dữ liệu</MenuItem>
                ) : (
                  countries.map(c => (
                    <MenuItem
                      key={c._id}
                      onClick={() => { navigate(`/quoc-gia/${c.slug}`); setAnchorCountry(null); }}
                    >
                      {c.name}
                    </MenuItem>
                  ))
                )}
              </Menu>

              <Button
                color="inherit"
                onClick={(e) => setAnchorYear(e.currentTarget)}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Năm phát hành
              </Button>
              <Menu
                anchorEl={anchorYear}
                open={Boolean(anchorYear)}
                onClose={() => setAnchorYear(null)}
                MenuListProps={{ sx: { maxHeight: 360 } }}
              >
                {years.map(y => (
                  <MenuItem key={y} onClick={() => goToYear(y)}>{y}</MenuItem>
                ))}
                <Divider />
                <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField
                    size="small"
                    label="Nhập năm"
                    type="number"
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && yearInput) {
                        goToYear(yearInput);
                      }
                    }}
                    InputProps={{ sx: { width: 120 } }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      if (yearInput) goToYear(yearInput);
                    }}
                  >
                    Go
                  </Button>
                </Box>
              </Menu>

              <Button
                color="inherit"
                onClick={(e) => setAnchorType(e.currentTarget)}
                sx={{ textTransform: "none", fontWeight: 500 }}
              >
                Loại phim
              </Button>
              <Menu
                anchorEl={anchorType}
                open={Boolean(anchorType)}
                onClose={() => setAnchorType(null)}
                MenuListProps={{ sx: { maxHeight: 320 } }}
              >
                {types.map(t => (
                  <MenuItem
                    key={t.slug}
                    onClick={() => { navigate(`/danh-sach/${t.slug}`); setAnchorType(null); }}
                  >
                    {t.name}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}

          {/* Right: search icon */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton color="inherit" onClick={() => navigate("/tim-kiem")}>
              <SearchIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer for mobile (keeps original accordion content) */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }} role="presentation">
          {/* Thể loại */}
          <List>
            <ListItem button onClick={() => setOpenCategory(!openCategory)}>
              <ListItemText primary="Thể loại" />
              {openCategory ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openCategory} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {categories.map(c => (
                  <ListItem
                    button
                    key={c._id}
                    onClick={() => {
                      navigate(`/the-loai/${c.slug}`);
                      toggleDrawer();
                    }}
                  >
                    <ListItemText primary={c.name} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </List>

          <Divider />

          {/* Quốc gia */}
          <List>
            <ListItem button onClick={() => setOpenCountry(!openCountry)}>
              <ListItemText primary="Quốc gia" />
              {openCountry ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openCountry} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {countries.map(c => (
                  <ListItem
                    button
                    key={c._id}
                    onClick={() => {
                      navigate(`/quoc-gia/${c.slug}`);
                      toggleDrawer();
                    }}
                  >
                    <ListItemText primary={c.name} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </List>

          <Divider />

          {/* Năm phát hành */}
          <List>
            <ListItem button onClick={() => setOpenYear(!openYear)}>
              <ListItemText primary="Năm phát hành" />
              {openYear ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openYear} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2, display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nhập năm"
                  type="number"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && yearInput) {
                      goToYear(yearInput);
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (yearInput) goToYear(yearInput);
                  }}
                >
                  Enter
                </Button>
              </Box>
            </Collapse>
          </List>

          <Divider />

          {/* Loại phim */}
          <List>
            <ListItem button onClick={() => setOpenType(!openType)}>
              <ListItemText primary="Loại phim" />
              {openType ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openType} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {types.map(t => (
                  <ListItem
                    button
                    key={t.slug}
                    onClick={() => {
                      navigate(`/danh-sach/${t.slug}`);
                      toggleDrawer();
                    }}
                  >
                    <ListItemText primary={t.name} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Header;
