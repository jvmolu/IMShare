import React from "react";
import FileProgressBar from "./FileProgressBar";

// FileUploadTab component
function FileUploadTab(props) {

    const filesBeingUploaded = props.filesBeingUploaded;

    return (
        <div>
            <h1>Uploads in Progress</h1>
            <ul>
                {filesBeingUploaded.map((file, index) => {
                    return <li key={index}>
                        <FileProgressBar file={file} />
                    </li>
                })}
            </ul>
        </div>
    );
}

export default FileUploadTab;
