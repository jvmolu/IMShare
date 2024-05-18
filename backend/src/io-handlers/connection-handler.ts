// Connection Handler for Socket Io Server Side
import { Server, Socket } from 'socket.io';
import { registerUserEvents } from './user-handler';
import { generateUUID } from './../utils/id-generator';

export const connectionHandler = (io: Server) => {
    // Generate a unique Id for the Socket
    io.engine.generateId = (req) => {
        return generateUUID();
    }
    io.on('connection', (socket: Socket) => {
        registerUserEvents(io, socket);
        // Disconnect Event
        socket.on('disconnect', () => {
            console.log('User Disconnected with ID: ', socket.id);
        });
        console.log('User Connected with ID: ', socket.id);
    });
}

export default connectionHandler;