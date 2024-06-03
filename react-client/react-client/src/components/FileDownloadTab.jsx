import React from "react";
import FileProgressBar from "./FileProgressBar";

// FileDownloadTab component
function FileDownloadTab(props) {

    const filesBeingDownloaded = props.filesBeingDownloaded;

    return (
        <div>
            <h1>Downloads in Progress</h1>
            <ul>
                {filesBeingDownloaded.map((file, index) => {
                    return <li key={index}>
                        <FileProgressBar file={file} />
                    </li>
                })}
            </ul>
        </div>
    );
}

export default FileDownloadTab;
