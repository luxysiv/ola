// src/components/Header.js
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemText,
  ListItemButton,
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

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [openCategory, setOpenCategory] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const [openType, setOpenType] = useState(false);

  const [anchorCategory, setAnchorCategory] = useState(null);
  const [anchorCountry, setAnchorCountry] = useState(null);
  const [anchorYear, setAnchorYear] = useState(null);
  const [anchorType, setAnchorType] = useState(null);

  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [yearInput, setYearInput] = useState("");

  const toggleDrawer = () => setOpen(!open);

  useEffect(() => {

    axios
      .get("https://phimapi.com/the-loai")
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]));

    axios
      .get("https://phimapi.com/quoc-gia")
      .then((res) => setCountries(res.data || []))
      .catch(() => setCountries([]));

  }, []);

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
      {/* HEADER */}
      <AppBar
        position="static"
        color="default"
        sx={(theme) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`
        })}
      >
        <Toolbar>

          {!isDesktop && (
            <IconButton
              edge="start"
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              cursor: "pointer",
              fontWeight: 700,
              color: "primary.main"
            }}
            onClick={() => navigate("/")}
          >
            Hdophim
          </Typography>

          {isDesktop && (
            <Box sx={{ display: "flex", gap: 2 }}>

              <Button
                color="inherit"
                onClick={(e) => setAnchorCategory(e.currentTarget)}
              >
                Thể loại
              </Button>

              <Button
                color="inherit"
                onClick={(e) => setAnchorCountry(e.currentTarget)}
              >
                Quốc gia
              </Button>

              <Button
                color="inherit"
                onClick={(e) => setAnchorYear(e.currentTarget)}
              >
                Năm phát hành
              </Button>

              <Button
                color="inherit"
                onClick={(e) => setAnchorType(e.currentTarget)}
              >
                Loại phim
              </Button>

            </Box>
          )}

          <IconButton
            onClick={() => navigate("/tim-kiem")}
          >
            <SearchIcon />
          </IconButton>

        </Toolbar>
      </AppBar>

      {/* ===== DESKTOP MENU ===== */}

      <Menu
        anchorEl={anchorCategory}
        open={Boolean(anchorCategory)}
        onClose={() => setAnchorCategory(null)}
      >
        {categories.map((c) => (
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

      <Menu
        anchorEl={anchorCountry}
        open={Boolean(anchorCountry)}
        onClose={() => setAnchorCountry(null)}
      >
        {countries.map((c) => (
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

      <Menu
        anchorEl={anchorYear}
        open={Boolean(anchorYear)}
        onClose={() => setAnchorYear(null)}
      >
        <Box sx={{ p: 2, display: "flex", gap: 1 }}>
          <TextField
            size="small"
            type="number"
            label="Nhập năm"
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
      </Menu>

      <Menu
        anchorEl={anchorType}
        open={Boolean(anchorType)}
        onClose={() => setAnchorType(null)}
      >
        {typeList.map((t) => (
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

      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        PaperProps={{
          sx: (theme) => ({
            backgroundColor: theme.palette.background.default
          })
        }}
      >
        <Box sx={{ width: 260 }}>

          <List>

            <ListItemButton
              onClick={() => setOpenCategory(!openCategory)}
            >
              <ListItemText primary="Thể loại" />
              {openCategory ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openCategory}>
              <List>
                {categories.map((c) => (
                  <ListItemButton
                    key={c._id}
                    onClick={() => {
                      navigate(`/the-loai/${c.slug}`);
                      toggleDrawer();
                    }}
                  >
                    <ListItemText primary={c.name} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>

          </List>

          <Divider />

          <List>

            <ListItemButton
              onClick={() => setOpenCountry(!openCountry)}
            >
              <ListItemText primary="Quốc gia" />
              {openCountry ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openCountry}>
              <List>
                {countries.map((c) => (
                  <ListItemButton
                    key={c._id}
                    onClick={() => {
                      navigate(`/quoc-gia/${c.slug}`);
                      toggleDrawer();
                    }}
                  >
                    <ListItemText primary={c.name} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>

          </List>

          <Divider />

          <List>

            <ListItemButton
              onClick={() => setOpenYear(!openYear)}
            >
              <ListItemText primary="Năm phát hành" />
              {openYear ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openYear}>
              <Box sx={{ p: 2, display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Nhập năm"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                />

                <Button
                  variant="contained"
                  onClick={goToYear}
                >
                  Go
                </Button>
              </Box>
            </Collapse>

          </List>

          <Divider />

          <List>

            <ListItemButton
              onClick={() => setOpenType(!openType)}
            >
              <ListItemText primary="Loại phim" />
              {openType ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={openType}>
              <List>
                {typeList.map((t) => (
                  <ListItemButton
                    key={t.slug}
                    onClick={() => {
                      navigate(`/danh-sach/${t.slug}`);
                      toggleDrawer();
                    }}
                  >
                    <ListItemText primary={t.name} />
                  </ListItemButton>
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
