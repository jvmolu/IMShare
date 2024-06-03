import React from 'react';

import './App.css';

import UploadFile from './components/UploadFile';
import DownloadFile from './components/DownloadFile';
import FileUploadTab from './components/FileUploadTab';
import FileDownloadTab from './components/FileDownloadTab';

import { useState, useEffect } from 'react';

import { io } from 'socket.io-client';
const socket = io('http://localhost:4000', {autoConnect: true});

function App() {

  // State to store the file handles being uploaded
  const [fileHandlesBeingUploaded, setFileHandlesBeingUploaded] = useState([{name: 'sampleUpload', size: 400, progress: 69, id: 0, status: 'pending'}]);
  // State to store the file handles being downloaded
  const [fileHandlesBeingDownloaded, setFileHandlesBeingDownloaded] = useState([
    {name: 'sampleDownload', size: 700, progress: 96, id: 0, status: 'pending'},
    {name: 'sampleDownload2', size: 800, progress: 100, id: 1, status: 'pending'}
  ]);

  return (
    <div className="App">
      
      {/* Title of the P2P File Sharing App */}
      <h1>P2P File Sharing App</h1>

      {/* Place Upload and Download Buttons in the grid */}

      <div className="grid-container">
        <UploadFile socket={socket} filesBeingUploaded={fileHandlesBeingUploaded} setFilesBeingUploaded={setFileHandlesBeingUploaded} />
        <DownloadFile socket={socket} filesBeingDownloaded={fileHandlesBeingDownloaded} setFilesBeingDownloaded={setFileHandlesBeingDownloaded} />
      </div>

      <FileUploadTab socket={socket} filesBeingUploaded={fileHandlesBeingUploaded} />
      <FileDownloadTab socket={socket} filesBeingDownloaded={fileHandlesBeingDownloaded} />

    </div>
  );

}

export default App;
