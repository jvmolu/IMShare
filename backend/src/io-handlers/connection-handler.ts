// Connection Handler for Socket Io Server Side
import { Server, Socket } from 'socket.io';

export const connectionHandler = (socket: Socket) => {

    // Server to Client Events
    socket.on('noArg', () => {
        console.log('noArg event received');
    });

    socket.on('basicEmit', (a: number, b: string, c: Buffer) => {
        console.log('basicEmit event received');
    });

    socket.on('sendFilePacketWithCallback', (filename: string, buffer: Buffer, packetId: number, ack: (success: boolean) => void) => {
        console.log('sendFilePacketWithCallback event received');
        ack(true);
    });

    // Client to Server Events
    socket.on('hello', () => {
        console.log('hello event received');
    });

    // Inter Server Events
    socket.on('ping', () => {
        console.log('ping event received');
    });

    // Socket Data
    socket.on('socketData', (data) => {
        console.log('socketData event received');
        console.log(data);
    });

    // Disconnect Event
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    // Error Event
    socket.on('error', (error) => {
        console.log('Error event received');
        console.log(error);
    });

    // Connection Event
    console.log('Client connected');
}

    

export default connectionHandler;