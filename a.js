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

let fileHandle;

// Queue
let queue = [];

async function processFile() {

    let handle;

    // USe File System Access API to open a file
    await window.showOpenFilePicker().then((fileHandles) => {
        handle = fileHandles[0];
    });

    fileHandle = handle;
    console.log("handle", handle);

    const fileVar = await handle.getFile();
    console.log("file", fileVar);

    // Read this video file at an offset of 10 bytes from the start
    const buffer = await fileVar.slice(10, 20).arrayBuffer();
    console.log("buffer", buffer);

    // Read Entire File - crashes for large files because of memory issues - use streams
    try {
        const buffer2 = await fileVar.arrayBuffer();
        console.log("buffer2", buffer2);
    } catch (e) {
        console.log("Error reading file: ", e);
    }

    // Check if data at 20th byte is present or not
    const buffer3 = await fileVar.slice(20, 21).arrayBuffer();
    console.log("buffer3", buffer3);

    if (buffer3.byteLength === 0) {
        console.log("Data not present at 20th byte");
    } else {
        console.log("Data present at 20th byte length: ", buffer3.byteLength);
    }
    
    // Check data at 5000th byte
    const buffer4 = await fileVar.slice(5000, 5001).arrayBuffer();
    console.log("buffer4", buffer4);

    if (buffer4.byteLength === 0) {
        console.log("Data not present at 5000th byte");
    } else {
        console.log("Data present at 5000th byte length: ", buffer4.byteLength);
    }

    // Mark Status as good to go
    document.getElementById("status").innerText = "File Processed Successfully, You can now start downloading the file";
}

async function startDownload() {

    // Keep Requesting Chunks to Save from the Server
    setInterval(() => {
        keepRequestingChunks();
    }, 10);

    // Keep downloading chunks in the queue
    setInterval(() => {
        saveRecievedChunks();
    }, 10);

}

// Sender ---------------------------------------------------------------
function giveRequestedChunk(startPosition, size) {


}

// Reciever ---------------------------------------------------------------
async function keepRequestingChunks() {

    // Check what chunks are missing

    // Request Chunks from the Server
    
    // Add the chunks to the queue
}


function saveRecievedChunks() {

    // Check if the queue is empty
    if (queue.length === 0) {
        return;
    }

    // Save the chunks to the file
    let chunk = queue.shift();
    let startPosition = chunk.startPosition;
    let size = chunk.size;

    // Save the chunk to the file
    saveChunkToFile(startPosition, size, chunk);
}


async function saveChunkToFile(startPosition, size, chunk) {

    // Open the file in read-write mode
    const writable = await fileHandle.createWritable();
    await writable.write(chunk, startPosition);
    await writable.close();

    console.log("Chunk saved successfully");
    console.log("Chunk index: ", startPosition);
}

