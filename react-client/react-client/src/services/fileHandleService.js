/**
    * @param {FileSystemFileHandle} fileHandle - The file handle of the file to write to
    * @param {Boolean} readWrite - The read/write permission to check for
    * @returns {Boolean} - The permission status
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
 * @returns {Array} - The chunks of data read from the file
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
 * @returns {Promise} - The promise object representing the chunk data
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