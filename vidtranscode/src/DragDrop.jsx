// Drag and drop functionality for uploading videos. Omitted for current build but will be implemented in future versions. 

import { useState, useEffect } from "react";

const DragDrop = ({ videoUpload }) => {
    const [dragActive, setDragActive] = useState(false);

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);

        const file = event.dataTransfer.files[0];

        if (file && file.type.startsWith('video/')) {
            videoUpload(file);
        }
    };

    const handleChange = (event) => {
        const file = event.target.files[0];

        if (file && file.type.startsWith('video/')) {
            videoUpload(file);
        }
    };

    return (
        <div
            className={`drag-and-drop-zone ${dragActive ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <p>Drag and drop your video here, or click to select a file</p>
            <input type="file" accept="video/*" onChange={handleChange} />
        </div>
    );
};

export default DragDrop;