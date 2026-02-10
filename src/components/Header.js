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
  Button
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);

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
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            PhimAPI
          </Typography>
          <Button color="inherit" onClick={() => navigate("/search")}>
            Tìm kiếm
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={open} onClose={toggleDrawer}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem>
              <Typography variant="subtitle1">Thể loại</Typography>
            </ListItem>
            {categories.map(c => (
              <ListItem
                button
                key={c._id}
                onClick={() => {
                  navigate(`/category/${c.slug}`);
                  toggleDrawer();
                }}
              >
                <ListItemText primary={c.name} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem>
              <Typography variant="subtitle1">Quốc gia</Typography>
            </ListItem>
            {countries.map(c => (
              <ListItem
                button
                key={c._id}
                onClick={() => {
                  navigate(`/country/${c.slug}`);
                  toggleDrawer();
                }}
              >
                <ListItemText primary={c.name} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem>
              <Typography variant="subtitle1">Năm</Typography>
            </ListItem>
            {Array.from({ length: 26 }, (_, i) => 2000 + i).map(y => (
              <ListItem
                button
                key={y}
                onClick={() => {
                  navigate(`/year/${y}`);
                  toggleDrawer();
                }}
              >
                <ListItemText primary={y} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem>
              <Typography variant="subtitle1">Loại phim</Typography>
            </ListItem>
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
                  navigate(`/list/${t.slug}`);
                  toggleDrawer();
                }}
              >
                <ListItemText primary={t.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Header;
