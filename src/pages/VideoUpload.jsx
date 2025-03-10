import React, { useState } from 'react';
import { Link, useNavigate, useParams } from "react-router-dom";
import '../App.css';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

// Video File Input Component
function VideoFileInput({ onFileChange }) {
  return (
    <div>
      <label>Upload your video:</label>
      <input
        type="file"
        accept="video/*"
        onChange={onFileChange}
      />
    </div>
  );
}

// Upload Button Component
function UploadButton({ onSubmit }) {
  return (
    <div>
      <button className="submit" type="submit" onClick={onSubmit}>Upload</button>
      <p>Please give up to 15 minutes for the video to be completely processed before it can be viewed :)<br/>
      Videos that are recorded on phones also do not work correctly at this stage :(</p>
    </div>
  );
}

// Upload Status Component
function UploadStatus({ status }) {
  return (
    <p>{status}</p>
  );
}

// Progress bar to show progress of uploading the video
function ProgressBar({ progress }) {
  return (
    <div className="progress-bar">
      <div className="progress" style={{ width: `${progress}%` }}>
        {progress}%
      </div>
    </div>
  );
}

function EnterName({ displayName, setDisplayName }) {
  return (
    <div>
      <label>{'Enter Display Name'}</label>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
    </div>
  );
}

// Main Video Upload Page Component with Cognito and S3 Upload
export default function VideoUploadPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();
  const email = sessionStorage.getItem('email'); // Cognito-stored email

  const metadataEndpoint = `${apiBaseUrl}/videos/metadata`;
  const uploadRequestEndpoint = `${apiBaseUrl}/videos/upload`

  // Handle file selection
  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  // Handle file upload submission
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setUploadStatus('Please select a video file.');
      return;
    }

    const formData = new FormData();
    formData.append('videoFile', videoFile);

    try {
      setUploadStatus('Uploading...');

      // Step 1. Request presigned URL
      const presignedURLRequestBody = {
        email: email,
        displayName: displayName
      };

      const presignedResponse = await fetch(uploadRequestEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        },
        body: JSON.stringify(presignedURLRequestBody)
      });

      if (!presignedResponse.ok) {
        throw new Error(`Failed to get presigned URL: ${await presignedResponse.text()}`);
      }

      const presignedRaw = await presignedResponse.json();
      const presignedProcessed = JSON.parse(presignedRaw.body);
      const presignedURL = presignedProcessed.url;
      console.log(presignedURL);
      const timeUploaded = presignedProcessed.timeUploaded;
      const videoKey = presignedProcessed.key;

      // Step 2: Upload metadata
      const metadataBody = {
        videoKey: videoKey,
        displayName: displayName,
        email: email,
        uploadTime: timeUploaded
      }

      const metadataResponse = await fetch(metadataEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        },
        body: JSON.stringify(metadataBody)
      });

      if (!metadataResponse.ok) {
        throw new Error(`Failed to store metadata: ${await metadataResponse.text()}`);
      }

      // Step 3: Upload video using presigned URL with polling
      const xhr = new XMLHttpRequest();

      console.log("Uploading video to:", presignedURL);

      // Call the endpoint for uploading video with Cognito authorization
      xhr.open('PUT', presignedURL, true);
      xhr.setRequestHeader('Content-Type', videoFile.type);

      // Monitor upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded / event.total) * 100);
          setProgress(percentCompleted);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadStatus('Video and metadata uploaded successfully!');
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setUploadStatus(`Upload failed: ${errorData.message}`);
        }
      };

      xhr.onerror = () => {
        setUploadStatus('Upload failed due to a network error.');
      };

      xhr.send(videoFile);
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.message}`);
    }
  };

  return (
    <div className='upload-page'>
      <h2>Upload a New Video</h2>
      <div className='upload-panel'>
        {/* File Input */}
        <VideoFileInput onFileChange={handleFileChange} />

        <EnterName displayName={displayName} setDisplayName={setDisplayName} />

        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Upload Button */}
        {videoFile && displayName.trim() !== "" && (
          <UploadButton onSubmit={handleUpload} />
        )}

        {/* Display Upload Status */}
        <UploadStatus status={uploadStatus} />

        {/* Back Button */}
        <Link to='/'>
          <button className='home-button'>
            Back
          </button>
        </Link>
      </div>
    </div>
  );
}
