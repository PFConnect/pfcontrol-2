import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL;

export function createChatSocket(
    sessionId: string,
    accessId: string,
    onMessage: (msg: ChatMessage) => void
) {
    const socket = io(SOCKET_URL, {
        withCredentials: true,
        path: '/sockets/chat',
        query: { sessionId, accessId }
    });
    socket.emit('joinSession', sessionId);

    socket.on('chatMessage', onMessage);

    return socket;
}

export interface ChatMessage {
    id: number;
    userId: string;
    username: string;
    avatar?: string;
    message: string;
    sent_at: string;
}