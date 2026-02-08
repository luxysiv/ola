import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Category from "./pages/Category";
import MovieDetail from "./pages/MovieDetail";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Trang chủ</Link> | 
        <Link to="/search">Tìm kiếm</Link> | 
        <Link to="/category">Thể loại/Quốc gia/Năm</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/category" element={<Category />} />
        <Route path="/movie/:slug" element={<MovieDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
