// src/pages/MovieDetail.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

function MovieDetail() {
  const { slug } = useParams();

  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const data = res.data;

        setMovie(data.movie);

        const epList =
          data.episodes?.[0]?.server_data || [];

        setEpisodes(epList);

        if (epList.length > 0) {
          setSrc(epList[0].link_m3u8);
        }
      })
      .catch(() => {
        setMovie(null);
        setEpisodes([]);
        setSrc(null);
      });
  }, [slug]);

  return (
    <div>
      {movie && (
        <>
          <h2>{movie.name}</h2>
          <p>{movie.origin_name}</p>
        </>
      )}

      {src && <VideoPlayer src={src} />}

      {/* Danh sách tập */}
      {episodes.length > 1 && (
        <div style={{ marginTop: 15 }}>
          <h3>Danh sách tập</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {episodes.map((ep, index) => (
              <button
                key={index}
                onClick={() => setSrc(ep.link_m3u8)}
              >
                {ep.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetail;
