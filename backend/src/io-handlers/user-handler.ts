import { Server, Socket } from 'socket.io';
import { ServerToClientEventsEnum, ClientToServerEventsEnum, InterServerEventsEnum } from '../events/event-types';


export const registerUserEvents = (io: Server, socket: Socket) => {

    socket.on(ClientToServerEventsEnum.get_id, (callback) => {
        console.log('get_id event received');
        callback(socket.id);
    });

    socket.on(ClientToServerEventsEnum.ping, () => {
        console.log('ping event received');
        socket.emit(ServerToClientEventsEnum.pong, 'You have been Ponged by the server!');
    });

}