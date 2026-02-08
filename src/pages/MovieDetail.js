import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

function MovieDetail() {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        setMovie(res.data);
        const link = res.data.episodes[0].server_data[0].link_m3u8;
        setSrc(link);
      });
  }, [slug]);

  return (
    <div>
      {movie && <h2>{movie.movie.name}</h2>}
      {src && <VideoPlayer src={src} />}
    </div>
  );
}

export default MovieDetail;
