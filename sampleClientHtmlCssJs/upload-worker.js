/**
 * @param {MessageEvent} event - The event object
 * @param {Object} event.data - The data sent from the main thread
 * @param {String} event.data.type - The type of the event
 * @param {Number} event.data.startPosition - The start position [byte index] of the chunk in the file
 * @param {Number} event.data.endPosition - The end position [byte index] of the chunk in the file
 * @param {FileSystemFileHandle} event.data.fileHandle - The file handle of the file to read from
 * @param {Number} event.data.uploadChunkSizeInBytes - The size of the chunk to read from the file
 * @emits {message: "FILE_HANDLE_NULL"};
 * @emits {message: "UPLOAD_CHUNK_SIZE_NULL"};
 * @emits {message: "CHUNK", chunk: chunk.value, startPosition: data.startPosition};
 * @emits {message: "PARTIAL_SUCCESS"};
 * @description This worker thread is attatched to a file and constantly listens if any chunk is requested to be uploaded from that file. This is used when user is uploading [Seeding] a file to the network.
**/
let myUploadChunkWorker = () => {

    /**
    * @param {FileSystemFileHandle} fileHandle - The file handle of the file to write to
    * @param {Boolean} readWrite - The read/write permission to check for
    * @returns {Boolean} The permission status
    * @description This function checks if the permission to read and write to the file is granted.
    * If the permission is granted, the function returns true. If the permission is not granted, the function requests the permission.
    * If the user grants the permission, the function returns true. If the user denies the permission, the function returns false.
    **/
    async function verifyPermission(fileHandle, readWrite) {
        const options = {mode: 'read'};
        if (readWrite) {
            options.mode = 'readwrite';
        }
        // Check if permission was already granted. If so, return true.
        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        // Request permission. If the user grants permission, return true.
        if ((await fileHandle.requestPermission(options)) === 'granted') {
            return true;
        }
        // The user didn't grant permission, so return false.
        return false;
    }
    
    
        /**
         * @param {FileSystemFileHandle} fileHandle - The file handle of the file to read from
         * @param {Number} startPosition - The start position [byte index] of the chunk in the file
         * @param {Number} endPosition - The end position [byte index] of the chunk in the file
         * @returns {Array} The chunks of data read from the file
         * @description This function reads the chunk of data from the file at the specified start and end position.
         **/
        async function* getChunkGenerator(fileHandle, startPosition, endPosition, uploadChunkSizeInBytes) {
    
        // Check if permission is granted to read and write to the file
        let permission = verifyPermission(fileHandle, false);
        if (!permission) {
            throw new Error("PERMISSION_DENIED");
        }
    
        // Open the file in read mode
        const file = await fileHandle.getFile();
    
        // Create a new file reader
        const reader = new FileReader();
    
        // Read the file as an ArrayBuffer
        const chunkReference = file.slice(startPosition, endPosition);
    
        console.log("CHUNK REFERENCE SIZE: ", chunkReference.size);
    
        // Read the chunk of data from the file in streaming mode with the specified chunk size
        let offset = 0;
        while (offset < chunkReference.size) {
            const chunk = chunkReference.slice(offset, offset + uploadChunkSizeInBytes);
            try {
                const buffer = await readChunk(chunk, reader, file.name);
                offset += uploadChunkSizeInBytes;
                uploadChunkSizeInBytes = yield buffer;
            } catch (error) {
                console.error(`Error reading chunk at offset ${offset}: ${error}`);
                throw error; // Stop the generator and throw the error
            }
        }
        }
    
    
        /**
         * @param {Blob} chunk - The chunk of data to read
         * @param {FileReader} reader - The file reader object
         * @returns {Promise} The promise object representing the chunk data
         * @description This function reads the chunk of data as an ArrayBuffer.
         **/
        async function readChunk(chunk, reader, fileName) {
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = (e) => {
                reject(new Error(`Error reading chunk: ${e.target.error}`));
            };
            // If Multiple Workers are accesing the same file, some workers might be reading the file while others are writing to it
            // This might cause a conflict, so we need to lock the file while reading
            // This will prevent any other worker from writing to the file while this worker is reading it
            // In future - Try to see if we can lock specific parts of the file instead of the whole file
            let lockKey = 'lock-' + fileName;
            navigator.locks.request(lockKey, async lock => {
                reader.readAsArrayBuffer(chunk);
            });
        });
        }

    let fileHandle = null;
    let uploadChunkSizeInBytes = null;

    self.addEventListener('message', async (event) => {

        console.log("UPLOAD WORKER MESSAGE RECEIVED:", event.data, "FROM MAIN THREAD");

        // If the event data is a file handle, store it in the fileHandle variable
        // Main Thread will pass the fileHandle to the worker thread in the first message
        if (event.data.type === 'start') {
            console.log("FILE_HANDLE SET IN UPLOAD WORKER");
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

        // lock
        let lockKey = 'upload-lock-' + fileHandle.name;
        navigator.locks.request(lockKey, async lock => {
            // Recieve the data from the main thread
            let data = event.data;
        
            try {
                // Read the chunks of data from the file in the range specified
                let chunksGenerator = getChunkGenerator(fileHandle, data.startPosition, data.endPosition, uploadChunkSizeInBytes);
                // Send the chunks of data to the main thread one by one
                while (true) {
                    // after getting the next chunk, update the chunkSize if the main thread has sent a new chunk size
                    // This will take effect from the next chunk onwards [not the current one being read]
                    let chunk = await chunksGenerator.next(uploadChunkSizeInBytes);
                    if (chunk.done) {
                        break;
                    }
                    self.postMessage({message: "CHUNK", chunk: chunk.value, startPosition: data.startPosition}, [chunk.value]);
                }
            }
            catch (error) {
                console.error(`Error reading chunk at offset ${data.startPosition}: ${error}`);
                self.postMessage({message: "PARTIAL_SUCCESS"});
            }
        });
    });
}