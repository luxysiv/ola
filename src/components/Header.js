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
  useMediaQuery
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Header() {
  const [open, setOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openType, setOpenType] = useState(false);

  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [yearInput, setYearInput] = useState("");

  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width:900px)");

  useEffect(() => {
    axios.get("https://phimapi.com/the-loai")
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]));

    axios.get("https://phimapi.com/quoc-gia")
      .then(res => setCountries(res.data || []))
      .catch(() => setCountries([]));
  }, []);

  const toggleDrawer = () => setOpen(!open);

  const goToYear = () => {
    if (yearInput) {
      navigate(`/nam/${yearInput}`);
      toggleDrawer();
    }
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#1c1c1c" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo */}
          <Typography
            variant="h6"
            sx={{ cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/")}
          >
            Hdophim
          </Typography>

          {/* Menu desktop */}
          {isDesktop ? (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button color="inherit" onClick={() => navigate("/danh-sach/phim-bo")}>Phim Bộ</Button>
              <Button color="inherit" onClick={() => navigate("/danh-sach/phim-le")}>Phim Lẻ</Button>
              <Button color="inherit" onClick={() => navigate("/danh-sach/tv-shows")}>TV Shows</Button>
              <Button color="inherit" onClick={() => navigate("/danh-sach/hoat-hinh")}>Hoạt Hình</Button>
              <Button color="inherit" onClick={() => navigate("/quoc-gia")}>Quốc gia</Button>
              <Button color="inherit" onClick={() => navigate("/nam/2025")}>Năm</Button>
            </Box>
          ) : (
            <IconButton color="inherit" edge="start" onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Search */}
          <IconButton color="inherit" onClick={() => navigate("/tim-kiem")}>
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer cho mobile */}
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
                    if (e.key === "Enter") goToYear();
                  }}
                />
                <Button
                  variant="contained"
                  onClick={goToYear}
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
                {[
                  { slug: "phim-bo", name: "Phim Bộ" },
                  { slug: "phim-le", name: "Phim Lẻ" },
                  { slug: "tv-shows", name: "TV Shows" },
                  { slug: "hoat-hinh", name: "Hoạt Hình" },
                  { slug: "phim-vietsub", name: "Phim Vietsub" },
                  { slug: "phim-thuyet-minh", name: "Phim Thuyết Minh" },
                  { slug: "phim-long-tieng", name: "Phim Lồng Tiếng" }
                ].map(t => (
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
