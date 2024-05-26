// <!-- Simple HTML with a Process File Button -->
// <!DOCTYPE html>
// <html>
// <head>
//     <title>Process File</title>
//     <!-- CSS -->
//     <style>
//         button {
//             padding: 10px 20px;
//             background-color: #4CAF50;
//             color: white;
//             border: none;
//             cursor: pointer;
//             margin: 10px;
//         }
//     </style>
// </head>
// <body>
//     <!--  Button -->
//     <button id="processFile" onclick="processFile()">Process File</button>
//     <button id="startDownload" onclick="startDownload()">Start Downloading File</button>
//     <div id="status"></div>
// </body>
// <!-- JS -->
// <script src="a.js"></script>
// </html>

import WorkerFactory from './react-client/react-client/src/workers/worker-factory.js'

// Create a worker from the worker function
const workerFactory = new WorkerFactory();
const saveChunkWorker = workerFactory.createSaveChunkWorker();
const uploadWorker = workerFactory.createUploadWorker();

const processFile = async () => {

    let handle;

    // Use File System Access API to open a file
    await window.showOpenFilePicker().then((fileHandles) => {
        handle = fileHandles[0];
    });

    fileHandle = handle;
    console.log("handle", handle);

    // Initialize the worker with the file handle
    saveChunkWorker.postMessage({ type: 'start', fileHandle: fileHandle });
    uploadWorker.postMessage({ type: 'start', fileHandle: fileHandle, uploadChunkSizeInBytes: 1024 });

    // Setting up OnMessage event listener for the worker
    saveChunkWorker.onmessage = (event) => {
        console.log("Message from Save Chunk Worker: ", event.data);
        switch(event.data.message) {
            case "FILE_HANDLE_NULL":
                console.log("File Handle is not defined in Save Chunk Worker");
                break;
            case "PERMISSION_DENIED":
                console.log("Permission Denied");
                break;
            case "CHUNK_ALREADY_FILLED":
                console.log("Chunk is already filled at position: ", event.data.position);
                break;
            case "CHUNK_SAVED":
                console.log("Chunk saved from position: ", event.data.startPosition, " to position: ", event.data.endPosition);
                break;
            default:
                console.log("Unknown message from Save Chunk Worker");
        }
    }

    // Setting up OnMessage event listener for the worker
    uploadWorker.onmessage = (event) => {
        console.log("Message from Upload Worker: ", event.data);
        switch(event.data.message) {
            case "FILE_HANDLE_NULL":
                console.log("File Handle is not defined in Upload Worker");
                break;
            case "UPLOAD_CHUNK_SIZE_NULL":
                console.log("Upload Chunk Size is not defined in Upload Worker");
                break;
            case "CHUNK":
                console.log("Chunk received from position: ", event.data.startPosition);
                break;
            case "PARTIAL_SUCCESS":
                console.log("Partial Success");
                break;
            default:
                console.log("Unknown message from Upload Worker");
        }
    }
}


const startDownload = async () => {
    // Request uploadWorker for chunks of data in linear order in chunks of 1024 bytes
}