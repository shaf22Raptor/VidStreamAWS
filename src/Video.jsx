import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VideoInfo from './VideoClass';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
// Logic to render and show videos on main page using the videoID. video.fileName is reference to videoID in mySQL server
export default class Video extends React.Component {
    render() {
        const { video } = this.props;
        return (
            <div className='video-link'>
                <div className='video-name'>
                    <Link to={`/video-player/${encodeURIComponent(video.videoKey)}`} state={{
                        displayName: video.displayName,
                        uploadTime: video.uploadTime
                    }}>
                        {video.displayName}
                    </Link>
                    <p style={{color:'black'}}>Uploaded: {video.uploadTime}</p>
                </div>
            </div>
        )
    }
}

