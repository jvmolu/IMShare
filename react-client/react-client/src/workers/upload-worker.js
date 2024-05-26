/**
 * @param {MessageEvent} event - The event object
 * @param {Object} event.data - The data sent from the main thread
 * @property {String} event.data.type - The type of the event
 * @property {Number} event.data.startPosition - The start position [byte index] of the chunk in the file
 * @property {Number} event.data.endPosition - The end position [byte index] of the chunk in the file
 * @property {FileSystemFileHandle} event.data.fileHandle - The file handle of the file to read from
 * @property {Number} event.data.uploadChunkSizeInBytes - The size of the chunk to read from the file
 * @emits {message: "FILE_HANDLE_NULL"};
 * @emits {message: "UPLOAD_CHUNK_SIZE_NULL"};
 * @emits {message: "CHUNK", chunk: chunk.value, startPosition: data.startPosition};
 * @emits {message: "PARTIAL_SUCCESS"};
 * @description This worker thread is attatched to a file and constantly listens if any chunk is requested to be uploaded from that file. This is used when user is uploading [Seeding] a file to the network.
**/
export default () => {

    importScripts('../services/fileHandleService.js');

    let fileHandle = null;
    let uploadChunkSizeInBytes = null;

    self.addEventListener('message', async (event) => {

        // If the event data is a file handle, store it in the fileHandle variable
        // Main Thread will pass the fileHandle to the worker thread in the first message
        if (event.data.type === 'start') {
            fileHandle = event.data.fileHandle;
            uploadChunkSizeInBytes = event.data.uploadChunkSizeInBytes;
            return;
        }
    
        if(event.data.type === 'end') {
            // Close the file handle
            fileHandle = null;
            return;
        }

        if(event.data.type === 'setChunkSize') {
            uploadChunkSizeInBytes = event.data.uploadChunkSizeInBytes;
            return;
        }
    
        // If file handle is not set and the event type is not fileHandle return an error saying please transfer file handle first
        if(fileHandle === null) {
            console.log("FILE_HANDLE NOT DEFINED IN UPLOAD WORKER");
            self.postMessage({message: "FILE_HANDLE_NULL"});
            return;
        }

        // If uploadChunkSizeInBytes is not set, return an error saying please set the chunk size first
        if(uploadChunkSizeInBytes === null) {
            console.log("UPLOAD_CHUNK_SIZE_NOT_DEFINED_IN_UPLOAD_WORKER");
            self.postMessage({message: "UPLOAD_CHUNK_SIZE_NULL"});
            return;
        }
    
        // Recieve the data from the main thread
        let data = event.data;
    
        try {
            // Read the chunks of data from the file in the range specified
            let chunksGenerator = getChunkGenerator(fileHandle, data.startPosition, data.endPosition, uploadChunkSizeInBytes);
            // Send the chunks of data to the main thread one by one
            while (true) {
                // after getting the next chunk, update the chunkSize if the main thread has sent a new chunk size
                // This will take effect from the next chunk onwards [not the current one being read]
                let chunk = chunksGenerator.next(uploadChunkSizeInBytes);
                if (chunk.done) {
                    break;
                }
                self.postMessage({message: "CHUNK", chunk: chunk.value, startPosition: data.startPosition});
            }
        }
        catch (error) {
            console.error(`Error reading chunk at offset ${data.startPosition}: ${error}`);
            self.postMessage({message: "PARTIAL_SUCCESS"});
        }
    });
}