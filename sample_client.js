const fs = require('fs');
const path = require('path');

let file_path = "C:/Users/anmol/Downloads/WhatsApp Image 2024-05-06 at 9.29.52 PM.jpeg";

// Function to read the file in chunks of 1MB
function read_file(file_path) {

    // Read the file in chunks of 0.4 KB
    let chunk_size = 900;

    // Read the file in binary chunks
    let file = fs.createReadStream(file_path, {highWaterMark: chunk_size});

    let indexOfChunk = 0;
    let fileName = file_path.split("/").pop();

    // Read the file in chunks
    file.on('data', (chunk) => {
        // Convert the chunk to binary
        chunk = Buffer.from(chunk).toString('binary');
        sendChunk(chunk, fileName, indexOfChunk);
        indexOfChunk++;
    });

    // Handle the end of the file
    file.on('end', () => {
        console.log("File read successfully");
    });

    // Handle the error
    file.on('error', (err) => {
        console.log("Error reading file: ", err);
    });
}



function sendChunk(chunk, file_name, indexOfChunk) {
    // Send the chunk to the server
    console.log("Sending chunk to the server");
    reciveChunk(chunk, file_name, indexOfChunk);
}


async function reciveChunk(chunk, file_name, indexOfChunk) {
    // Sleep Randomly for 1-5 seconds
    let sleepTime = Math.floor(Math.random() * 5) + 1;
    await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
    // Receive the chunk on the server
    console.log("Receiving chunk with index: ", indexOfChunk);
    // Save in file
    saveChunk(chunk, file_name, indexOfChunk);
}

function saveChunk(chunk, file_name, indexOfChunk) {
    // Save the chunk in the file
    console.log("Saving chunk in the file");

    let downloadDirectory = "C:/Users/anmol/Desktop/Coding/DogeShare/recievedData";
    let file_path = downloadDirectory + "/" + file_name;

    if (!fs.existsSync(downloadDirectory)) {
        fs.mkdirSync(downloadDirectory);
    }

    // If the file does not exist, create it
    if (!fs.existsSync(file_path)) {
        fs.writeFileSync(file_path, '');
    }

    // Open the file in read-write mode
    let fd = fs.openSync(file_path, 'r+');

    // Convert the chunk back to a Buffer
    let buffer = Buffer.from(chunk, 'binary');

    // Calculate the position at which to write the chunk
    let chunk_size = 900; // This should be the same as the chunk size in the read_file function
    let position = indexOfChunk * chunk_size;

    // while file size <= position keep writing
    let stats = fs.statSync(file_path);
    let fileSize = stats.size;
    let extraSize = position - fileSize;
    if (extraSize > 0) {
        console.log("Extra size: ", extraSize);
        let extraBuffer = Buffer.alloc(extraSize);
        // Append Extra Buffer to the file
        fs.writeSync(fd, extraBuffer, 0, extraBuffer.length, fileSize);
    }

    // Write the chunk at the correct position in the file
    fs.writeSync(fd, buffer, 0, buffer.length, position);

    fs.closeSync(fd);

    // Truncate the file to remove any extra bytes at the end
    truncateFile(file_path);

    console.log("Chunk saved successfully");
    console.log("Chunk index: ", indexOfChunk);
}

function truncateFile(file_path) {
    // Open the file in read-write mode
    let fd = fs.openSync(file_path, 'r+');

    // Get the current file size
    let stats = fs.fstatSync(fd);
    let size = stats.size;

    // Create a buffer to read one byte at a time
    let buffer = Buffer.alloc(1);

    // Read the file backwards from the end
    for (let i = size - 1; i >= 0; i--) {
        fs.readSync(fd, buffer, 0, 1, i);
        if (buffer[0] !== 0) {
            // This is the position of the last non-null byte
            fs.ftruncateSync(fd, i + 1);
            break;
        }
    }

    // Close the file
    fs.closeSync(fd);
}

read_file(file_path);


//// ISSUE : WHEN ONE THREAD IS PROCESSING FILE, ANOTHER ALSO COMING IN. SO PROCESS FILE EDIT REQUESTS ATOMICALLY IN ORDER THEY COME USING A QUEUE
/// WHEN QUEUE IS FULL [200 MB] THEN SIGNAL SERVER TO STOP SENDING MORE PACKETS OF THE FILE
/// WHEN QUEUE IS FREE THEN SIGNAL SERVER TO START SENDING MORE PACKETS OF THE FILE

// APPROACH - 1 FOR FILE SHARING [PEOPLE ARE ASKING A SPECIFIC SENDER FOR THE FILE] [SIMILAR TO SEND ANYWHERE BUT WITH MULTIPLE USERS]
// CREATE A ROOM
// USERS JOIN THAT ROOM
// NOW THE SENDER [WHO CREATED THE ROOM STARTS SENDING FILE TO ALL USERS IN THE ROOM]
// HE SENDS ALL CHUNKS TO ALL USERS IN THE ROOM
// IF HE RECIEVES STOP SIGNAL FROM ANY USER THEN HE STOPS SENDING FILE TO ALL USERS
// IF HE RECIEVES START SIGNAL FROM ALL USERS THEN HE STARTS SENDING FILE TO ALL USERS AGAIN

// APPROACH 1-B:
// SERVER ONLY SENDS PACKET WHEN USER REQUESTS IT
// USER REQUESTS PACKET FROM SERVER WHEN HE IS READY TO RECIEVE IT [HE HAS SPACE IN HIS QUEUE]

// APPROACH - 2 FOR FILE SHARING - SIMILAR TO TORRENT CLIENT [ASK FILE FROM WHOLE NETWORK]
// SINGLE FILE - FIXED CHUNKS -> MENTIONED IN A TORRENT LIKE FILE [METADATA FILE]
// USER SAYS DOWNLOAD THIS FILE FOR ME TO OUR CLIENT
// CLIENT SEES WHAT CHUNKS ARE ALREADY DOWNLOADED
// REMAINING CHUNKS ARE REQUESTED FROM THE SERVER
// SERVER CHECKS WHAT USERS ARE UPLOADING THIS FILE [PEERS]
// TAKES THOSE CHUNKS FROM THOSE USERS AND SENDS TO THE REQUESTING USER
// SERVER REQUESTS CHUNKS FROM PEERS IN PARALLEL [REQUEST DIFFERENCE CHUNKS FROM DIFFERENT PEERS]
// CLIENT AT A TIME ASKES FOR ONLY SOME CHUNKS SUCH THAT THE DATA CAN EASILY FIT IN QUEUE
