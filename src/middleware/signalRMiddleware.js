import { USER_LOGIN, SEND_MESSAGE, RECEIVE_MESSAGE, ADD_MESSAGE, SET_ONLINE } from "../actions/types";
import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import * as signalR from '@aspnet/signalr';
import { adaptClientMessageForServer, adaptServerMessageForClient } from "../adapters/chatMessageAdapter";
let _connected = false;
let _hubConnection = "";

export const signalRMiddleware = (store) => {
    return (next) => (action) => {
        if (action.signalR) {
            switch (action.type) {
                case USER_LOGIN:
                    startConnection(action.payload, store);
                    break;
                case SEND_MESSAGE:
                    let chatMessage = adaptClientMessageForServer(action.payload[0], store)
                    _hubConnection.invoke('SendPrivateMessage', chatMessage).catch(err => {
                        console.log(err)
                    })
                    break;
                default:
                    {
                        break;
                    }
            }
        }
        return next(action);
    }
}




const startConnection = (token, store) => {
    if (!_connected) {
        _hubConnection = new HubConnectionBuilder()
            .withUrl("http://877baef7.ngrok.io/chat?access_token=" + token)
            .build();
        console.log("in start connection");
        registerOnServerEvents(_hubConnection, store);
        _hubConnection.onclose((error) => {
            connected = false;
        })
        _hubConnection
            .start()
            .then(() => {
                console.log('Hub connection started');

                _connected = true;
            })
            .catch(err => {
                console.log('Error while establishing connection, retrying...');
                setTimeout(() => _hubConnection.startConnection(), 5000);
            });
    }

}

const registerOnServerEvents = (hubConnection, store) => {
    hubConnection.on('SendToAll', (data) => {
        console.log(data);
    })
    hubConnection.on('SendConnections', (data) => {
        console.log(data);
    })
    hubConnection.on('ReceiveMessage', (data) => {
        let message = adaptServerMessageForClient(data);
        store.dispatch({
            type: ADD_MESSAGE,
            payload: message
        })
    })

    hubConnection.on('SendOnlineConnections', (data) => {
        store.dispatch({
            type:SET_ONLINE,
            payload:data
        })
        console.log(data);
    })
}
