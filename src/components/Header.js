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
  Collapse
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
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("https://phimapi.com/the-loai")
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]));

    axios.get("https://phimapi.com/quoc-gia")
      .then(res => setCountries(res.data || []))
      .catch(() => setCountries([]));
  }, []);

  const toggleDrawer = () => setOpen(!open);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleDrawer}>
            <MenuIcon />
          </IconButton>

          {/* Logo Hdophim dẫn về trang chủ */}
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Hdophim
          </Typography>

          {/* Nút tìm kiếm bằng icon */}
          <IconButton color="inherit" onClick={() => navigate("/tim-kiem")}>
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

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

          {/* Năm */}
          <List>
            <ListItem button onClick={() => setOpenYear(!openYear)}>
              <ListItemText primary="Năm phát hành" />
              {openYear ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openYear} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {Array.from({ length: 26 }, (_, i) => 2000 + i).map(y => (
                  <ListItem
                    button
                    key={y}
                    onClick={() => {
                      navigate(`/nam/${y}`);
                      toggleDrawer();
                    }}
                  >
                    <ListItemText primary={y} />
                  </ListItem>
                ))}
              </List>
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
