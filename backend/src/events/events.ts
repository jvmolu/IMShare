interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    sendFilePacketWithCallback: (filename: string, buffer: Buffer, packetId: number, ack: (success: boolean) => void) => void;
}
  
interface ClientToServerEvents {
    hello: () => void;
}

interface InterServerEvents {
    ping: () => void;
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