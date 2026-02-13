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
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Header() {
  const [open, setOpen] = useState(false);
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

  // Menu state cho desktop
  const [anchorEl, setAnchorEl] = useState(null);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "#1c1c1c" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{ cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/")}
          >
            Hdophim
          </Typography>

          {isDesktop ? (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button color="inherit" onClick={handleMenuOpen}>Thể loại</Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {categories.map(c => (
                  <MenuItem
                    key={c._id}
                    onClick={() => {
                      navigate(`/the-loai/${c.slug}`);
                      handleMenuClose();
                    }}
                  >
                    {c.name}
                  </MenuItem>
                ))}
              </Menu>

              <Button color="inherit" onClick={() => navigate("/quoc-gia")}>Quốc gia</Button>
              <Button color="inherit" onClick={() => navigate("/nam/2025")}>Năm</Button>
              <Button color="inherit" onClick={() => navigate("/danh-sach/phim-bo")}>Phim Bộ</Button>
              <Button color="inherit" onClick={() => navigate("/danh-sach/phim-le")}>Phim Lẻ</Button>
            </Box>
          ) : (
            <IconButton color="inherit" edge="start" onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>
          )}

          <IconButton color="inherit" onClick={() => navigate("/tim-kiem")}>
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer cho mobile giữ nguyên như bạn đã làm */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        {/* ... giữ nguyên code Drawer cũ ... */}
      </Drawer>
    </>
  );
}

export default Header;
