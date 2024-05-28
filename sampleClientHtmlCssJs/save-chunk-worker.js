/**
 * @param {MessageEvent} event - The event object
 * @param {Object} event.data - The data sent from the main thread
 * @param {String} event.data.type - The type of the event
 * @param {ArrayBuffer} event.data.chunk - The chunk of file data
 * @param {Number} event.data.startPosition - The start position [byte index] of the chunk in the file
 * @param {FileSystemFileHandle} event.data.fileHandle - The file handle of the file to write to
 * @emits {message: "FILE_HANDLE_NULL"};
 * @emits {message: "PERMISSION_DENIED"};
 * @emits {message: "CHUNK_ALREADY_FILLED", position: data.startPosition};
 * @emits {message: "CHUNK_SAVED", startPosition: data.startPosition, endPosition: data.startPosition + data.chunk.byteLength};
 * @description This worker thread saves a chunk of data to a file at the specified start position. The file handle is used to write the data to the file using a writable stream.
**/
let mySaveChunkWorker = () => {

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
    
    self.addEventListener('message', async (event) => {

      // If the event data is a file handle, store it in the fileHandle variable
      // Main Thread will pass the fileHandle to the worker thread in the first message
      if (event.data.type === 'start') {
        fileHandle = event.data.fileHandle;
        return;
      }

      if(event.data.type === 'end') {
        // Close the file handle
        fileHandle = null;
        return;
      }

      // If file handle is not set and the event type is not fileHandle return an error saying please transfer file handle first
      if(fileHandle === null) {
        console.log("FILE_HANDLE NOT DEFINED IN SAVE CHUNK WORKER");
        self.postMessage({message: "FILE_HANDLE_NULL"});
        return;
      }

      // Recieve the data from the main thread
      let data = event.data;

      // Check if permission is granted to read and write to the file
      let permission = verifyPermission(fileHandle, true);
      if (!permission) {
          console.log("PERMISSION_DENIED");
          // Return false to the main thread
          self.postMessage({message: "PERMISSION_DENIED"})
          return;
      }

      let stats = await fileHandle.getFile();
      let lockKey = 'lock-' + stats.name;

      // Aquire Lock - Critical Section -------------------------------------
      await navigator.locks.request(lockKey, async lock => {

        stats = await fileHandle.getFile(); // Get the latest stats
        let writableStream = await fileHandle.createWritable();

        // TODO. CHECK IF IT IS ACTUALLY NEEDED OR IT CAN CAUSE ISSUES
        // IF I AM GETTING : (2,9)
        // AND (2,3) is filled, then I will ignore the request because I already have the data
        // Ignore this request [Already Recieved this chunk via some other peer]
        let contentAtPosition = await stats.slice(data.startPosition, data.startPosition + 1).arrayBuffer();
        if(contentAtPosition.byteLength !== 0) { // If the byte at the start position is not empty
          // TODO. Is this message needed?
          // Seems like yes in above mentioned case we will simply say 2 position is filled so dont request it again
          postMessage({message: "CHUNK_ALREADY_FILLED", position: data.startPosition});
          return;
        }

        console.log("FILE SIZE BEFORE TRUNCATE: ", stats.size);

        // Allocate Extra Space if needed
        let extraSpace = data.startPosition - stats.size;
        if(extraSpace > 0) {
          // Allocate extra space
          console.log("Allocating extra space: ", extraSpace);
          await writableStream.truncate(stats.size + extraSpace);
        }
                
        // Write the chunk to file
        writableStream.write({type: 'write', position: data.startPosition, data: data.chunk})

        // Save changes to Disk
        await writableStream.close();

        stats = await fileHandle.getFile();
        console.log("FILE SIZE AFTER TRUNCATE: ", stats.size);

        // Lock is released after the critical section -----------------------  
      });
      
      // Notify the main thread that the chunk has been saved
      self.postMessage({message: "CHUNK_SAVED", startPosition: data.startPosition, endPosition: data.startPosition + data.chunk.byteLength});
    });
};