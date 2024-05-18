enum ServerToClientEventsEnum {
    pong = 'pong',
    filePacketWithCallback = 'filePacketWithCallback'
}

enum ClientToServerEventsEnum {
    get_id = 'get_id',
    ping = 'ping'
}

enum InterServerEventsEnum {
    ping = 'ping',
    pong = 'pong'
}


export {
    ServerToClientEventsEnum,
    ClientToServerEventsEnum,
    InterServerEventsEnum
};