import React from "react";
import YouTube from 'react-youtube';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export default function VideoPlayerPanel({ videoID }) {

    if (videoID) {
        const vidSource = `${apiBaseUrl}/video/stream-video/${videoID}`;
        return (
            <div className="video-area">
                <video controls>
                    <source src={vidSource} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        )
    };
};
