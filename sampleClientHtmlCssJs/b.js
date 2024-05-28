// Create a worker from the worker function
const saveChunkWorker = WorkerFactory.createSaveChunkWorker();
const uploadWorker = WorkerFactory.createUploadWorker();

let uploadFileHandle;
let downloadFileHandle;
let chunkQueue = [];
let countOfChunks = 0;

const processFile = async () => {

    let handle;

    // Use File System Access API to open a file
    await window.showOpenFilePicker().then((fileHandles) => {
        handle = fileHandles[0];
    });

    uploadFileHandle = handle;
    console.log("handle", handle);

    // Initialize the worker with the file handle
    uploadWorker.postMessage({ type: 'start', fileHandle: uploadFileHandle, uploadChunkSizeInBytes: 1024 });

    // Setting up OnMessage event listener for the worker
    uploadWorker.onmessage = (event) => {
        console.log("Message from Upload Worker: ", event.data);
        switch(event.data.message) {
            case "FILE_HANDLE_NULL":
                console.log("File Handle is not defined in Upload Worker, reinitialize the worker with the file handle");
                uploadWorker.postMessage({type: 'start', fileHandle: uploadFileHandle, uploadChunkSizeInBytes: 1024})
                break;
            case "UPLOAD_CHUNK_SIZE_NULL":
                console.log("Upload Chunk Size is not defined in Upload Worker, reinitialize the worker with the chunk size");
                uploadWorker.postMessage({type: 'setChunkSize', uploadChunkSizeInBytes: 1024});
                break;
            case "CHUNK":
                console.log("Chunk received from position: ", event.data.startPosition);
                // Add the chunk to the queue
                chunkQueue.push(event.data);
                break;
            case "PARTIAL_SUCCESS":
                console.log("Partial Success");
                break;
            default:
                console.log("Unknown message from Upload Worker");
        }
    }

    // Mark Status as good to go
    document.getElementById("status").innerText = "File Processed Successfully, You can now start downloading the file";
}


const startDownload = async () => {

    // Request uploadWorker for chunks of data in linear order in chunks of 1024 bytes
    uploadWorker.postMessage({ type: 'setChunkSize', uploadChunkSizeInBytes: 1024 });

    let downloadDirectoryHandle = null;

    // Select the directory for file download
    await window.showDirectoryPicker().then((directoryHandle) => {
        downloadDirectoryHandle = directoryHandle;
    });

    let fileBeingUploaded = await uploadFileHandle.getFile();

    // Create a new file in the selected directory
    downloadFileHandle = await downloadDirectoryHandle.getFileHandle(fileBeingUploaded.name, { create: true });

    saveChunkWorker.postMessage({ type: 'start', fileHandle: downloadFileHandle });

    // Setting up OnMessage event listener for the worker
    saveChunkWorker.onmessage = (event) => {
        console.log("Message from Save Chunk Worker: ", event.data);
        switch(event.data.message) {
            case "FILE_HANDLE_NULL":
                console.log("File Handle is not defined in Save Chunk Worker, reinitialize the worker with the file handle");
                saveChunkWorker.postMessage({type: 'start', fileHandle: downloadFileHandle});
                break;
            case "PERMISSION_DENIED":
                console.log("Permission Denied, DEBUG the issue");
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

    setInterval(() => {
        checkQueueAndSaveChunks();
    }, 10);

    // Start Requesting Chunks from the Server
    for (let i = 0; i < fileBeingUploaded.size; i += 1024) {
        console.log("Requesting Chunk from position: ", i);
        countOfChunks++;
        uploadWorker.postMessage({ type: 'requestChunk', startPosition: i, endPosition: i + 1024 });
    }

    // Upload Completed
    console.log("Upload Completed");
}

const checkQueueAndSaveChunks = async () => {

    // Check if the queue is empty
    if (chunkQueue.length === 0) {
        return;
    }

    console.log("Saving Chunk to File")
    countOfChunks--;

    // Save the chunks to the file
    let data = chunkQueue.shift();
    let startPosition = data.startPosition;
    let chunk = data.chunk;

    saveChunkWorker.postMessage({ type: 'saveChunk', startPosition: startPosition, chunk: chunk }, [chunk]);

    // If all chunks are saved, close the worker
    if (countOfChunks === 0) {
        console.log("All Chunks Saved");
    }
}