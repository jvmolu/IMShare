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
//         }
//     </style>
// </head>
// <body>
//     <!--  Button -->
//     <button id="processFile" onclick="processFile()">Process File</button>
// </body>
// <!-- JS -->
// <script src="a.js"></script>
// </html>


async function processFile() {

    let handle;

    // USe File System Access API to open a file
    await window.showOpenFilePicker().then((fileHandles) => {
        handle = fileHandles[0];
    });

    console.log("handle", handle);

    const fileVar = await handle.getFile();

    console.log("file", fileVar);

    // Read this video file at an offset of 10 bytes from the start
    const buffer = await fileVar.slice(10, 20).arrayBuffer();

    console.log("buffer", buffer);
}