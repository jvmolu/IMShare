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
export default () => {

    importScripts('../services/fileHandleService.js');

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

        // Recieve the data from the main thread
        let data = event.data;

        stats = await fileHandle.getFile(); // Get the latest stats
        let writableStream = await fileHandle.createWritable({keepExistingData: true});

        // TODO. FIX THIS CHECK
        // TODO. CHECK IF IT IS ACTUALLY NEEDED OR IT CAN CAUSE ISSUES
        // IF I AM GETTING : (2,9)
        // AND (2,3) is filled, then I will ignore the request because I already have the data
        // Ignore this request [Already Recieved this chunk via some other peer]
        // let contentAtPosition = await stats.slice(data.startPosition, data.startPosition + 1).arrayBuffer();
        // if(contentAtPosition.byteLength !== 0) { // If the byte at the start position is not empty
        //   // TODO. Is this message needed?
        //   // Seems like yes in above mentioned case we will simply say 2 position is filled so dont request it again
        //   self.postMessage({message: "CHUNK_ALREADY_FILLED", position: data.startPosition});
        //   await writableStream.close();
        //   return;
        // }

        console.log("FILE SIZE BEFORE TRUNCATE: ", stats.size);

        // Allocate Extra Space if needed
        let extraSpace = data.startPosition - stats.size;
        if(extraSpace > 0) {
          // Allocate extra space
          console.log("Allocating extra space: ", extraSpace);
          await writableStream.truncate(stats.size + extraSpace);
        }

        console.log("WRITING CHUNK TO FILE: ", data.startPosition, " - ", data.startPosition + data.chunk.byteLength);
        
        // Write the chunk to file
        writableStream.write({type: 'write', position: data.startPosition, data: data.chunk})

        // Save changes to Disk
        await writableStream.close();

        stats = await fileHandle.getFile();
        console.log("FILE SIZE AFTER TRUNCATE: ", stats.size);

        // Notify the main thread that the chunk has been saved
        self.postMessage({message: "CHUNK_SAVED", startPosition: data.startPosition, endPosition: data.startPosition + data.chunk.byteLength});

        // Lock is released after the critical section -----------------------  
      });
    });
};