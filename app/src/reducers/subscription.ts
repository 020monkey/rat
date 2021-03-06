import { Action } from '../constants';
import ControlSocket from '../control';
import { MessageHandler } from '../messages';
import { SubscribeMessage } from '../messages/outgoing-messages';

const initialState: MessageHandler[] = [];

export default (state = initialState, action) => {
  switch (action.type) {
    case Action.SUBSCRIBE:
      ControlSocket.send(
        new SubscribeMessage({
          type: action.payload.type,
          subscribe: true,
        })
      );

      return [...state, action.payload];
    case Action.UNSUBSCRIBE:
      ControlSocket.send(
        new SubscribeMessage({
          type: action.payload,
          subscribe: false,
        })
      );
      return state.filter(sub => sub !== action.payload.handler);
    default:
      return state;
  }
};

export const selectSubscriptions = state => state.subscriptions;
