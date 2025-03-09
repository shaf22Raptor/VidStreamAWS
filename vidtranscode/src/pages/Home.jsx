import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../App.css';
import Video from '../Video.jsx';
import VideoInfo from "../VideoClass.js";

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
const API_ENDPOINT = `${apiBaseUrl}/videos`; // API endpoint to retrieve all available videos

// Top of the main page with login and navigation logic, utilizing Cognito authentication
const Head = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const email = sessionStorage.getItem('email'); // Email from session storage

    // Check if the user is logged in by checking for tokens in sessionStorage
    useEffect(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        if (accessToken) {
            setIsLoggedIn(true); // User is logged in if the token exists
        } else {
            setIsLoggedIn(false); // User is not logged in
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Log the user out by clearing session storage and redirecting to the login page
    const logOut = () => {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('idToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('email');

        setIsLoggedIn(false); // Update the state to reflect logout
        navigate('/login'); // Redirect to the login page
    };

    return (
        <div className="head">
            <h1>VidStream</h1>
            <p>A streaming site deployed using AWS</p>
            <p style={{fontSize:10}}>Note: Response times may be slow due to cold starts of AWS infrastructure</p>
            {isLoggedIn ? (
                <div>
                    {/* Link to video upload page */}
                    <Link to={`/video-upload`}>
                        <button>Upload a new video</button>
                    </Link>
                    <button onClick={logOut}>Logout</button>
                </div>
            ) : (
                <div>
                    <Link to="/login">
                        <button>Login</button>
                    </Link>
                    <Link to="/register">
                        <button>Register</button>
                    </Link>
                </div>
            )}
        </div>
    );
};

// Render the video thumbnails and library of videos stored on the server
const Recommended = ({ videos }) => {
    return (
        <div className="recommended">
            <h1>Browse our extensive library of amazing videos!</h1>
            <VideoThumbnails videos={videos} />
        </div>
    );
};

// Render individual video thumbnails for the video library
const VideoThumbnails = ({ videos }) => {
    return (
        <div className="thumbnails">
            {Array.isArray(videos) && videos.length > 0 ? (
                videos.map((video, index) => (
                    <Video key={index} video={video} />
                ))
            ) : (
                <p>No videos available</p>
            )}
        </div>
    );
};

// Function to fetch the list of videos stored on the server
const fetchVideos = async (setVideos) => {
    try {
        console.log(API_ENDPOINT);
        const response = await fetch(API_ENDPOINT); // fetch videos from RDS
        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        const parsedBody = JSON.parse(data.body);
        console.log(parsedBody);
        
        // Map the data to VideoInfo objects
        const videoObjects = parsedBody.videos.map(video => new VideoInfo(
            video.videoKey,
            video.displayName,
            video.uploadTime
        ));

        setVideos(videoObjects); // Update the state with the fetched video objects
    } catch (error) {
        console.error('Error fetching videos:', error);
    }
};

// Home component that combines the header, video library, and fetch logic
export default function Home() {
    const [videos, setVideos] = useState([]);

    // Fetch videos once the component mounts
    useEffect(() => {
        fetchVideos(setVideos);
    }, []); // Empty dependency array ensures this runs once on mount

    return (
        <div className="homepage">
            <div className="header">
                <Head />
            </div>
            <div className="video-library">
                <Recommended videos={videos} />
            </div>
        </div>
    );
}
