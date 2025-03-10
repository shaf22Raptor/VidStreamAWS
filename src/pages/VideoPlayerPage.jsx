import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
//import VideoPlayerPanel from "../VideoPlayer.jsx";

import '../App.css';
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export default function VideoPlayer() {
  const { videoFileName } = useParams();
  const location = useLocation();
  const { displayName, uploadTime } = location.state || {};

  // Request presigned URL from S3 to stream video
  async function RequestURL(videoKey) {
    try {
      const response = await fetch(`${apiBaseUrl}/videos/${encodeURIComponent(videoKey)}`);
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to fetch presigned URL");
      }

      const data = await response.json();
      const parsedBody = JSON.parse(data.body)
      console.log("Presigned URL", parsedBody.presignedURL);
      return parsedBody.presignedURL;

    } catch (error) {
      console.error("Error fetching presigned URL:", error);
      return null;
    }
  }

  function VideoPlayerPanel({ videoKey }) {
    const [presignedURL, setPresignedURL] = useState(null);
    useEffect(() => {
      const fetchURL = async () => {
        if (videoKey) {
          const url = await RequestURL(videoKey)
          setPresignedURL(url);
        }
      };
      fetchURL();
    }, [videoKey]);

    return (
      <div className="video-area">
        {presignedURL ? (
          <video controls>
            <source src={presignedURL} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <p>Loading video...</p>
        )}
      </div>
    )
  }

  // Layout for the videoplayer page, to play a selected video
  return (
    <div className="video-player">
      <Link to='/'>
        <button>
          Back
        </button>
      </Link>

      {/* Check to see if the selected video is a video stored on local storage, or a YouTube video */}
      <VideoPlayerPanel videoKey={videoFileName} />
      <h1>{displayName || "Unknown video"}</h1>
      <p>{uploadTime}</p>
    </div>
  );
}