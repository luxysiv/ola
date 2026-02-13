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
    if (!yearInput) return;
    navigate(`/nam/${yearInput}`);
    setOpen(false);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>

          {/* Menu icon chỉ hiện trên mobile */}
          {!isDesktop && (
            <IconButton color="inherit" edge="start" onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Typography
            variant="h6"
            sx={{ cursor: "pointer", mr: 3 }}
            onClick={() => navigate("/")}
          >
            Hdophim
          </Typography>

          {/* Menu ngang cho desktop */}
          {isDesktop && (
            <Box sx={{ display: "flex", gap: 3, flexGrow: 1 }}>
              <Button color="inherit" onClick={() => navigate("/the-loai")}>
                Thể loại
              </Button>

              <Button color="inherit" onClick={() => navigate("/quoc-gia")}>
                Quốc gia
              </Button>

              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Năm..."
                  type="number"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToYear();
                  }}
                  sx={{ bgcolor: "white", borderRadius: 1 }}
                />
                <Button variant="contained" onClick={goToYear}>
                  Xem
                </Button>
              </Box>
            </Box>
          )}

          {/* Search */}
          <IconButton color="inherit" onClick={() => navigate("/tim-kiem")}>
            <SearchIcon />
          </IconButton>

        </Toolbar>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }}>

          {/* Thể loại */}
          <List>
            <ListItem button onClick={() => setOpenCategory(!openCategory)}>
              <ListItemText primary="Thể loại" />
              {openCategory ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={openCategory} unmountOnExit>
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
            <Collapse in={openCountry} unmountOnExit>
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

        </Box>
      </Drawer>
    </>
  );
}

export default Header;
