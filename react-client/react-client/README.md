# System Design

4 Web Workers

### 1. Main Worker -> 

Manages the other workers and stores the state of the application

Main worker will store all the open file handles

Main Thread deals with all the communication with the central server

### 2. Save Chunk Worker -> Saves the incoming chunk to file

Recives the chunk and the file handle from the main worker and saves it to the file



### 3. Upload File Worker -> Uploads the requested chunk


### 4. Request Chunk Worker -> Requests the chunk from the server