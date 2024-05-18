import { createServer } from 'http';
import dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import { connectionHandler } from './io-handlers/connection-handler';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from './events/events';

dotenv.config({ path: __dirname+'./../.env' });

const httpServer = createServer(express());

// CORS ALLOWED ORIGINS
const CORS_ORIGINS : string = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:4000';

const io = new Server<
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData
>(httpServer, {
  cors: {
    origin: CORS_ORIGINS.split(',')
  },
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  }
});

connectionHandler(io);

httpServer.listen(4000, () => {
  console.log('listening on *:4000');
});