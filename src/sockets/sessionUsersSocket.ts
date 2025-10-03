import io from 'socket.io-client';
import type { SessionUser } from '../types/session';
import type { ChatMention } from '../types/chats';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL;

export function createSessionUsersSocket(
    sessionId: string,
    accessId: string,
    user: { userId: string; username: string; avatar: string | null },
    onUsersUpdate: (users: SessionUser[]) => void,
    onConnect?: () => void,
    onDisconnect?: () => void,
    onReconnecting?: () => void,
    onReconnect?: () => void,
    onMention?: (mention: ChatMention) => void
) {
    interface CustomSocket extends ReturnType<typeof io> {
        emitAtisGenerated?: (data: unknown) => void;
    }
    const socket = io(SOCKET_URL, {
        withCredentials: true,
        path: '/sockets/session-users',
        query: {
            sessionId,
            accessId,
            user: JSON.stringify(user)
        }
    }) as CustomSocket;

    if (onConnect) {
        socket.on('connect', onConnect);
    }
    if (onDisconnect) {
        socket.on('disconnect', () => onDisconnect());
    }
    if (onReconnecting) {
        socket.on('reconnecting', () => onReconnecting());
    }
    if (onReconnect) {
        socket.on('reconnect', () => onReconnect());
    }
    
    socket.on('sessionUsersUpdate', onUsersUpdate);
    
    if (onMention) {
        socket.on('chatMention', onMention);
    }

    socket.emitAtisGenerated = (data: unknown) => {
        socket.emit('atisGenerated', data);
    };

    return socket;
}