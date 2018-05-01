import { IncomingMessage } from 'http';
import * as http from 'http';
import * as https from 'https';
import Message from 'shared/messages';
import * as WebSocket from 'ws';

import { ClientUpdateType } from '../../shared/src/templates/client';
import { clientServer } from './index';
import ClientMessage from './ws/messages/client.message';
import WebClient from './ws/webClient';

import chalk from 'chalk';
const debug = require('debug')('server:ws');

class ControlSocketServer {
  /**
   * Broadcast websocket message to all connected clients
   * that has subscribed to the event
   * @param message
   * @param force sending even if client is not subscribed
   */
  public static async broadcast(message: Message, force: boolean = false) {
    ControlSocketServer.clients.forEach(client => client.emit(message, force));
  }

  /**
   * All globally connected clients
   */
  private static clients: WebClient[] = [];

  private server: WebSocket.Server;

  constructor(server: https.Server | http.Server) {
    this.server = new WebSocket.Server({ server });
    this.server.on('connection', (ws, req) => this.onConnection(ws, req));
  }

  private onConnection(ws: WebSocket, req: IncomingMessage) {
    debug('connect', chalk.bold(req.connection.remoteAddress));

    const client = new WebClient(ws);

    // broadcast all connected clients to new websocket connection
    clientServer.clients.forEach(c =>
      client.emit(
        new ClientMessage({
          initial: true,
          type: ClientUpdateType.ADD,
          ...c.getClientProperties(),
          ...c.getSystemProperties(),
        }),
        true
      )
    );

    ws.on('close', (code, reason) => {
      debug(
        `lost ${chalk.bold(req.connection.remoteAddress)} ${code} (${reason})`
      );

      ControlSocketServer.clients.splice(
        ControlSocketServer.clients.indexOf(client),
        1
      );
    });

    ControlSocketServer.clients.push(client);
  }
}

export default ControlSocketServer;
