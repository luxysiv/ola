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
  Menu,
  MenuItem,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Header() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const [open, setOpen] = useState(false);

  const [openCategory, setOpenCategory] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openType, setOpenType] = useState(false);

  // anchor dropdown desktop
  const [anchorCategory, setAnchorCategory] = useState(null);
  const [anchorCountry, setAnchorCountry] = useState(null);
  const [anchorYear, setAnchorYear] = useState(null);
  const [anchorType, setAnchorType] = useState(null);

  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [yearInput, setYearInput] = useState("");

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

  const goToYear = () => {
    if (yearInput) {
      navigate(`/nam/${yearInput}`);
      setAnchorYear(null);
      setOpen(false);
    }
  };

  const typeList = [
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
      <AppBar position="static">
        <Toolbar>

          {/* Mobile menu icon */}
          {!isDesktop && (
            <IconButton color="inherit" onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Hdophim
          </Typography>

          {/* Desktop menu */}
          {isDesktop && (
            <Box sx={{ display: "flex", gap: 2, mr: 2 }}>

              <Button color="inherit"
                onClick={(e) => setAnchorCategory(e.currentTarget)}>
                Thể loại
              </Button>

              <Button color="inherit"
                onClick={(e) => setAnchorCountry(e.currentTarget)}>
                Quốc gia
              </Button>

              <Button color="inherit"
                onClick={(e) => setAnchorYear(e.currentTarget)}>
                Năm phát hành
              </Button>

              <Button color="inherit"
                onClick={(e) => setAnchorType(e.currentTarget)}>
                Loại phim
              </Button>
            </Box>
          )}

          <IconButton
            color="inherit"
            onClick={() => navigate("/tim-kiem")}
          >
            <SearchIcon />
          </IconButton>

        </Toolbar>
      </AppBar>

      {/* ===== DESKTOP DROPDOWN ===== */}

      {/* Category */}
      <Menu
        anchorEl={anchorCategory}
        open={Boolean(anchorCategory)}
        onClose={() => setAnchorCategory(null)}
      >
        {categories.map(c => (
          <MenuItem
            key={c._id}
            onClick={() => {
              navigate(`/the-loai/${c.slug}`);
              setAnchorCategory(null);
            }}
          >
            {c.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Country */}
      <Menu
        anchorEl={anchorCountry}
        open={Boolean(anchorCountry)}
        onClose={() => setAnchorCountry(null)}
      >
        {countries.map(c => (
          <MenuItem
            key={c._id}
            onClick={() => {
              navigate(`/quoc-gia/${c.slug}`);
              setAnchorCountry(null);
            }}
          >
            {c.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Year */}
      <Menu
        anchorEl={anchorYear}
        open={Boolean(anchorYear)}
        onClose={() => setAnchorYear(null)}
      >
        <Box sx={{ p: 2, display: "flex", gap: 1 }}>
          <TextField
            size="small"
            label="Nhập năm"
            type="number"
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goToYear();
            }}
          />
          <Button variant="contained" onClick={goToYear}>
            Enter
          </Button>
        </Box>
      </Menu>

      {/* Type */}
      <Menu
        anchorEl={anchorType}
        open={Boolean(anchorType)}
        onClose={() => setAnchorType(null)}
      >
        {typeList.map(t => (
          <MenuItem
            key={t.slug}
            onClick={() => {
              navigate(`/danh-sach/${t.slug}`);
              setAnchorType(null);
            }}
          >
            {t.name}
          </MenuItem>
        ))}
      </Menu>

      {/* ===== MOBILE DRAWER ===== */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }}>

          {/* Thể loại */}
          <List>
            <ListItem button onClick={() => setOpenCategory(!openCategory)}>
              <ListItemText primary="Thể loại" />
              {openCategory ? <ExpandLess /> : <ExpandMore />}
            </ListItem>

            <Collapse in={openCategory}>
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

            <Collapse in={openCountry}>
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

            <Collapse in={openYear}>
              <Box sx={{ p: 2, display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Nhập năm"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToYear();
                  }}
                />
                <Button variant="contained" onClick={goToYear}>
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

            <Collapse in={openType}>
              <List component="div" disablePadding>
                {typeList.map(t => (
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
