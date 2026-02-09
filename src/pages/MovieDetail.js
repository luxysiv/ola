// src/pages/MovieDetail.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";

function MovieDetail() {
  const { slug } = useParams();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const data = res.data;

        setMovie(data.movie || []);
        setServers(data.episodes || []);

        if (data.episodes?.length > 0) {
          const firstEp =
            data.episodes[0].server_data?.[0];

          if (firstEp) {
            setSrc(firstEp.link_m3u8);
          }
        }
      })
      .catch(() => {
        setMovie(null);
        setServers([]);
        setSrc(null);
      });
  }, [slug]);

  const episodeList =
    servers[currentServer]?.server_data || [];

  return (
    <div>
      {/* Thông tin phim */}
      {movie && (
        <>
          <h2>{movie.name}</h2>
          <p>{movie.origin_name}</p>
        </>
      )}

      {/* Player */}
      {src && <VideoPlayer src={src} />}

      {/* Danh sách server */}
      {servers.length > 1 && (
        <div style={{ marginTop: 15 }}>
          <h3>Server</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {servers.map((sv, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentServer(index);

                  const firstEp =
                    sv.server_data?.[0];
                  if (firstEp) {
                    setSrc(firstEp.link_m3u8);
                  }
                }}
              >
                {sv.server_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách tập */}
      {episodeList.length > 0 && (
        <div style={{ marginTop: 15 }}>
          <h3>Danh sách tập</h3>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8
            }}
          >
            {episodeList.map((ep, i) => (
              <button
                key={i}
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
