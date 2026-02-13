import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";

import Home from "./pages/Home";
import Search from "./pages/Search";
import CategoryPage from "./pages/CategoryPage";
import CountryPage from "./pages/CountryPage";
import YearPage from "./pages/YearPage";
import MovieDetail from "./pages/MovieDetail";
import TypeListPage from "./pages/TypeListPage";
import Header from "./components/Header";
import LatestPage from "./pages/LatestPage";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      {/* layout full height */}
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Header />

        {/* nội dung */}
        <Box sx={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/phim-moi-cap-nhat" element={<LatestPage />} />
            <Route path="/tim-kiem" element={<Search />} />
            <Route path="/the-loai/:category" element={<CategoryPage />} />
            <Route path="/quoc-gia/:country" element={<CountryPage />} />
            <Route path="/nam/:year" element={<YearPage />} />
            <Route path="/danh-sach/:type_list" element={<TypeListPage />} />
            <Route path="/phim/:slug" element={<MovieDetail />} />
          </Routes>
        </Box>

        <Footer />
      </Box>
    </Router>
  );
}

export default App;
