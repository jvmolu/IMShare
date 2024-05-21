// Download Worker - Recieves a chunk of file and saves it in the file at the correct position in the file using file system access api
// function saveChunk(chunk, file_name, indexOfChunk) {
//     // Save the chunk in the file
//     console.log("Saving chunk in the file");

//     let downloadDirectory = "C:/Users/anmol/Desktop/Coding/DogeShare/recievedData";
//     let file_path = downloadDirectory + "/" + file_name;

//     if (!fs.existsSync(downloadDirectory)) {
//         fs.mkdirSync(downloadDirectory);
//     }

//     // If the file does not exist, create it
//     if (!fs.existsSync(file_path)) {
//         fs.writeFileSync(file_path, '');
//     }

//     // Open the file in read-write mode
//     let fd = fs.openSync(file_path, 'r+');

//     // Convert the chunk back to a Buffer
//     let buffer = Buffer.from(chunk, 'binary');

//     // Calculate the position at which to write the chunk
//     let chunk_size = 900; // This should be the same as the chunk size in the read_file function
//     let position = indexOfChunk * chunk_size;

//     // while file size <= position keep writing
//     let stats = fs.statSync(file_path);
//     let fileSize = stats.size;
//     let extraSize = position - fileSize;
//     if (extraSize > 0) {
//         console.log("Extra size: ", extraSize);
//         let extraBuffer = Buffer.alloc(extraSize);
//         // Append Extra Buffer to the file
//         fs.writeSync(fd, extraBuffer, 0, extraBuffer.length, fileSize);
//     }

//     // Write the chunk at the correct position in the file
//     fs.writeSync(fd, buffer, 0, buffer.length, position);

//     fs.closeSync(fd);

//     // Truncate the file to remove any extra bytes at the end
//     truncateFile(file_path);

//     console.log("Chunk saved successfully");
//     console.log("Chunk index: ", indexOfChunk);
// }

// function truncateFile(file_path) {
//     // Open the file in read-write mode
//     let fd = fs.openSync(file_path, 'r+');

//     // Get the current file size
//     let stats = fs.fstatSync(fd);
//     let size = stats.size;

//     // Create a buffer to read one byte at a time
//     let buffer = Buffer.alloc(1);

//     // Read the file backwards from the end
//     for (let i = size - 1; i >= 0; i--) {
//         fs.readSync(fd, buffer, 0, 1, i);
//         if (buffer[0] !== 0) {
//             // This is the position of the last non-null byte
//             fs.ftruncateSync(fd, i + 1);
//             break;
//         }
//     }

//     // Close the file
//     fs.closeSync(fd);
// }

// e.data contains the data sent from the main thread
// In this case, it is an object with the following properties:
// - chunk: the chunk of file data - buffer
// - startPostion: the start position of the chunk in the file
// - fileHandle: the file handle of the file to write to

// TODO. DO I USE A WRITABLE STREAM OR A SYNC ACCESS HANDLE [USES OPFS]

export default () => {

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
        self.postMessage("FILE_HANDLE_NULL");
      }

      // Recieve the data from the main thread
      let data = e.data;

      // Check if permission is granted to read and write to the file
      let permission = await verifyPermission(fileHandle, true);
      if (!permission) {
          console.log("PERMISSION_DENIED");
          // Return false to the main thread
          self.postMessage("PERMISSION_DENIED");
          return;
      }

      let readableStream = fileHandle.createReadable();
      let writableStream = fileHandle.createWritable();

      // TODO. Aquire Lock - Critical Section
      await navigator.locks.request('save-chunk-lock', async lock => {

        // TODO. If start position filled -> Ignore this request [Already Recieved this chunk via some other peer]
        

        // Check if file needs to be allocated more space
        let stats = await fileHandle.getFile();

        // Get the file size
        let fileSize = stats.size;

        // TODO. Allocate Extra Size if needed

        // TODO. Write the chunk to file

        // Save changes to Disk
        syncAccessHandle.flush();

        // Lock is released after the critical section
      });
      

      // Aquire write lock for meta data file
      await navigator.locks.request('metadata-lock', async lock => {
  
        // TODO. Write in the metadata file that this space is filled
  
      });

    });

    async function verifyPermission(fileHandle, readWrite) {
        const options = {};
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
};