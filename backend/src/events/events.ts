import { ServerToClientEventsEnum, ClientToServerEventsEnum, InterServerEventsEnum } from "./event-types";

interface ServerToClientEvents {
    [ServerToClientEventsEnum.pong]: () => void;
    [ServerToClientEventsEnum.filePacketWithCallback]: (data: string, callback: (response: string) => void) => void;
}
  
interface ClientToServerEvents {
    [ClientToServerEventsEnum.get_id]: (callback: (id: string) => void) => void;
    [ClientToServerEventsEnum.ping]: () => void;
}

interface InterServerEvents {
    [InterServerEventsEnum.ping]: () => void;
    [InterServerEventsEnum.pong]: () => void;
}

interface SocketData {
    name: string;
    age: number;
}

// Export
export {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData
};