// File Progress Bar Component Similar to Torrent Client
import React from "react";
import './styles/FileProgressBar.css';

// FileProgressBar component
function FileProgressBar(props) {

    const file = props.file;

    return (
        <div class='file-progress-bar'>
            <h2>{file.name}</h2>
            <progress value={file.progress} max="100"></progress>
            <p>{file.progress}%</p>
        </div>
    );
}

export default FileProgressBar;

