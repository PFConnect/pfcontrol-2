import { useEffect, useRef, useState } from 'react';
import { fetchChatMessages, reportChatMessage, fetchGlobalChatMessages } from '../../utils/fetch/chats';
import { useAuth } from '../../hooks/auth/useAuth';
import { createChatSocket } from '../../sockets/chatSocket';
import { createGlobalChatSocket, type GlobalChatMessage } from '../../sockets/globalChatSocket';
import { Send, Trash, X, Flag, MessageCircle, Radio } from 'lucide-react';
import type { ChatMessage, ChatMention } from '../../types/chats';
import type { SessionUser } from '../../types/session';
import type { ToastType } from '../common/Toast';
import Button from '../common/Button';
import Loader from '../common/Loader';
import Modal from '../common/Modal';
import Toast from '../common/Toast';

interface ChatSidebarProps {
  sessionId: string;
  accessId: string;
  open: boolean;
  onClose: () => void;
  sessionUsers: SessionUser[];
  onMentionReceived?: (mention: ChatMention) => void;
  station?: string;
  position?: string;
}

export default function ChatSidebar({
  sessionId,
  accessId,
  open,
  onClose,
  sessionUsers,
  onMentionReceived,
  station,
  position,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [activeChatUsers, setActiveChatUsers] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<SessionUser[]>(
    []
  );
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingMessageId, setReportingMessageId] = useState<number | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [automoddedMessages, setAutomoddedMessages] = useState<Map<number, string>>(
    new Map()
  );
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingDeleteRef = useRef<ChatMessage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  // PFATC Global Chat state
  const [activeTab, setActiveTab] = useState<'session' | 'pfatc'>('session');
  const [globalMessages, setGlobalMessages] = useState<GlobalChatMessage[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [globalInput, setGlobalInput] = useState('');
  const [activeGlobalChatUsers, setActiveGlobalChatUsers] = useState<string[]>([]);
  const [showGlobalMentionSuggestions, setShowGlobalMentionSuggestions] = useState(false);
  const [globalMentionSuggestions, setGlobalMentionSuggestions] = useState<SessionUser[]>([]);
  const [selectedGlobalSuggestionIndex, setSelectedGlobalSuggestionIndex] = useState(-1);
  const globalSocketRef = useRef<ReturnType<typeof createGlobalChatSocket> | null>(null);
  const globalMessagesEndRef = useRef<HTMLDivElement>(null);
  const globalPendingDeleteRef = useRef<GlobalChatMessage | null>(null);
  const globalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Socket connection - connects once and stays alive (separate from open/close UI state)
  useEffect(() => {
    if (!sessionId || !accessId || !user) return;

    // Connect to chat socket (stays connected even when chat closes)
    if (!socketRef.current) {
      socketRef.current = createChatSocket(
        sessionId,
        accessId,
        user.userId,
        (msg: ChatMessage) => {
          setMessages((prev) => {
            // Prevent duplicates if message already exists
            if (prev.some((m) => m.id === msg.id)) {
              return prev;
            }
            return [...prev, msg];
          });
        },
        (data: { messageId: number }) => {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
          // Clean up automodded tracking when message is deleted
          setAutomoddedMessages((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.messageId);
            return newMap;
          });
        },
        (data: { messageId: number; error: string }) => {
          if (
            pendingDeleteRef.current &&
            pendingDeleteRef.current.id === data.messageId
          ) {
            setMessages((prev) => {
              const newMessages = [...prev, pendingDeleteRef.current!];
              return newMessages.sort(
                (a, b) =>
                  new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
              );
            });
            pendingDeleteRef.current = null;
          }
        },
        (users: string[]) => {
          setActiveChatUsers(users);
        },
        (mention: ChatMention) => {
          if (mention.mentionedUserId === user.userId && onMentionReceived) {
            onMentionReceived(mention);
          }
        },
        (data: { messageId: number; reason?: string }) => {
          setAutomoddedMessages((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.messageId, data.reason || 'Hate speech detected');
            return newMap;
          });
        }
      );

      // If chat is already open when socket connects, emit chatOpened
      if (open) {
        socketRef.current.socket.emit('chatOpened');
      }
    }

    // Cleanup only when component unmounts completely (not when chat closes)
    return () => {
      if (socketRef.current) {
        socketRef.current.socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [sessionId, accessId, user, onMentionReceived]); // Socket stays alive when chat closes

  // Notify backend when chat UI opens/closes (for active indicator)
  useEffect(() => {
    if (!socketRef.current) return;

    if (open) {
      // User opened chat UI
      socketRef.current.socket.emit('chatOpened');
    } else {
      // User closed chat UI
      socketRef.current.socket.emit('chatClosed');
    }
  }, [open]);

  // Load messages once when chat is first opened
  useEffect(() => {
    if (!sessionId || !open || messagesLoaded) return;

    setLoading(true);
    setErrorMessage(null);
    fetchChatMessages(sessionId)
      .then((fetchedMessages) => {
        setMessages(fetchedMessages);
        setLoading(false);
        setMessagesLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to fetch chat messages:', error);
        setErrorMessage('Failed to load chat messages');
        setMessages([]);
        setLoading(false);
        setMessagesLoaded(true);
      });
  }, [sessionId, open, messagesLoaded]); // Fetch messages only when chat opens for the first time

  // Global Chat Socket Connection
  useEffect(() => {
    if (!user) return;

    // Connect to global chat socket (stays connected)
    if (!globalSocketRef.current) {
      globalSocketRef.current = createGlobalChatSocket(
        user.userId,
        station || null,
        position || null,
        (msg: GlobalChatMessage) => {
          setGlobalMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) {
              return prev;
            }
            return [...prev, msg];
          });
        },
        (data: { messageId: number }) => {
          setGlobalMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        },
        (data: { messageId: number; error: string }) => {
          if (globalPendingDeleteRef.current && globalPendingDeleteRef.current.id === data.messageId) {
            setGlobalMessages((prev) => {
              const newMessages = [...prev, globalPendingDeleteRef.current!];
              return newMessages.sort(
                (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
              );
            });
            globalPendingDeleteRef.current = null;
          }
        },
        (users: string[]) => {
          setActiveGlobalChatUsers(users);
        },
        (data: { messageId: number; reason: string }) => {
          setAutomoddedMessages((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.messageId, data.reason);
            return newMap;
          });
        },
        (mention) => {
          // Pass global chat mentions up to parent component
          if (mention.mentionedUserId === user.userId && onMentionReceived) {
            onMentionReceived({
              id: mention.messageId,
              userId: mention.mentionedUserId,
              username: mention.mentionerUsername,
              message: mention.message,
              timestamp: new Date(mention.timestamp).getTime(),
              sessionId: 'global-chat', // Special identifier for global chat mentions
            });
          }
        }
      );

      // If PFATC tab is active when socket connects, emit globalChatOpened
      if (open && activeTab === 'pfatc') {
        globalSocketRef.current.socket.emit('globalChatOpened');
      }
    }

    // Cleanup only when component unmounts
    return () => {
      if (globalSocketRef.current) {
        globalSocketRef.current.socket.disconnect();
        globalSocketRef.current = null;
      }
    };
  }, [user, station, position, onMentionReceived]); // Socket stays alive

  // Notify backend when global chat tab opens/closes
  useEffect(() => {
    if (!globalSocketRef.current) return;

    if (open && activeTab === 'pfatc') {
      globalSocketRef.current.socket.emit('globalChatOpened');
    } else {
      globalSocketRef.current.socket.emit('globalChatClosed');
    }
  }, [open, activeTab]);

  // Load global messages when PFATC tab is first opened
  useEffect(() => {
    if (!open || activeTab !== 'pfatc' || globalMessages.length > 0) return;

    setGlobalLoading(true);
    fetchGlobalChatMessages()
      .then((fetchedMessages) => {
        setGlobalMessages(fetchedMessages);
        setGlobalLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch global chat messages:', error);
        setGlobalMessages([]);
        setGlobalLoading(false);
      });
  }, [open, activeTab]); // Load when PFATC tab is opened

  // Smart auto-scroll: only scroll if user is already at the bottom
  useEffect(() => {
    if (messagesEndRef.current && isAtBottomRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Track if user is at the bottom of the scroll area
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    isAtBottomRef.current = isAtBottom;
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const searchTerm = mentionMatch[1].toLowerCase();
      const suggestions = sessionUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(searchTerm) && u.id !== user?.userId
      );
      setMentionSuggestions(suggestions);
      setShowMentionSuggestions(suggestions.length > 0);
      setSelectedSuggestionIndex(suggestions.length > 0 ? 0 : -1);
    } else {
      setShowMentionSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const insertMention = (username: string) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = input.substring(0, cursorPos);
    const textAfterCursor = input.substring(cursorPos);
    const mentionMatch = textBeforeCursor.match(/(.*)@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = mentionMatch[1];
      const newText = beforeMention + `@${username} ` + textAfterCursor;
      setInput(newText);
      setShowMentionSuggestions(false);

      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeMention.length + username.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
    setSelectedSuggestionIndex(-1);
  };

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || input.trim().length > 500)
      return;
    socketRef.current.socket.emit('chatMessage', {
      sessionId,
      user,
      message: input.trim(),
    });
    setInput('');
  };

  const sendGlobalMessage = () => {
    if (!globalInput.trim() || !globalSocketRef.current || globalInput.trim().length > 500)
      return;
    globalSocketRef.current.socket.emit('globalChatMessage', {
      user,
      message: globalInput.trim(),
    });
    setGlobalInput('');
  };

  const renderMessage = (message: string) => {
    return message.replace(
      /@([^\s]+)/g,
      '<span class="text-blue-400 font-semibold">@$1</span>'
    );
  };

  const isUserInActiveChat = (userId: string) => {
    return activeChatUsers.includes(userId);
  };

  async function handleDelete(msgId: number) {
    if (!socketRef.current || !user) return;

    const messageToDelete = messages.find((m) => m.id === msgId);
    if (!messageToDelete) return;

    pendingDeleteRef.current = messageToDelete;
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    socketRef.current.deleteMessage(msgId, user.userId);
  }

  async function handleGlobalDelete(msgId: number) {
    if (!globalSocketRef.current || !user) return;

    const messageToDelete = globalMessages.find((m) => m.id === msgId);
    if (!messageToDelete) return;

    globalPendingDeleteRef.current = messageToDelete;
    setGlobalMessages((prev) => prev.filter((m) => m.id !== msgId));
    globalSocketRef.current.deleteMessage(msgId, user.userId);
  }

  const handleGlobalInputChange = (value: string) => {
    setGlobalInput(value);

    const cursorPos = globalTextareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const searchTerm = mentionMatch[1].toLowerCase();
      // For global chat, show all session users as potential mentions
      const suggestions = sessionUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(searchTerm) && u.id !== user?.userId
      );
      setGlobalMentionSuggestions(suggestions);
      setShowGlobalMentionSuggestions(suggestions.length > 0);
      setSelectedGlobalSuggestionIndex(suggestions.length > 0 ? 0 : -1);
    } else {
      setShowGlobalMentionSuggestions(false);
      setSelectedGlobalSuggestionIndex(-1);
    }
  };

  const insertGlobalMention = (username: string) => {
    const cursorPos = globalTextareaRef.current?.selectionStart || 0;
    const textBeforeCursor = globalInput.substring(0, cursorPos);
    const textAfterCursor = globalInput.substring(cursorPos);
    const mentionMatch = textBeforeCursor.match(/(.*)@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = mentionMatch[1];
      const newText = beforeMention + `@${username} ` + textAfterCursor;
      setGlobalInput(newText);
      setShowGlobalMentionSuggestions(false);

      setTimeout(() => {
        if (globalTextareaRef.current) {
          const newCursorPos = beforeMention.length + username.length + 2;
          globalTextareaRef.current.focus();
          globalTextareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  async function handleReport(msgId: number) {
    setReportingMessageId(msgId);
    setShowReportModal(true);
  }

  async function handleSubmitReport() {
    if (!reportingMessageId || !reportReason.trim()) return;

    try {
      await reportChatMessage(
        sessionId,
        reportingMessageId,
        reportReason.trim()
      );
      setToast({ message: 'Message reported successfully.', type: 'success' }); // Update to use state
      setShowReportModal(false);
      setReportReason('');
      setReportingMessageId(null);
    } catch {
      setToast({ message: 'Failed to report message.', type: 'error' }); // Update to use state
    }
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-100 bg-zinc-900 text-white transition-transform duration-300 ${
        open ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
      } rounded-l-3xl border-l-2 border-blue-800 flex flex-col`}
      style={{ zIndex: 100 }}
    >
      <div className="flex justify-between items-center p-5 border-b border-blue-800 rounded-tl-3xl">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-xl text-blue-300">
            Chat
          </span>
        </div>
        <button
          onClick={() => onClose()}
          className="p-1 rounded-full hover:bg-gray-700"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Chat Tabs */}
      <div className="px-5 pt-3 border-b border-blue-800 bg-zinc-900">
        <div className="flex gap-0 mb-3">
          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'session'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Session</span>
          </button>
          <button
            onClick={() => setActiveTab('pfatc')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-t-lg font-semibold transition-colors ${
              activeTab === 'pfatc'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>PFATC</span>
          </button>
        </div>
      </div>

      {/* Active Users */}
      <div className="px-5 py-2 border-b border-blue-800 bg-zinc-900">
        <div className="flex flex-wrap gap-1">
          {activeTab === 'session' ? (
            sessionUsers.map((sessionUser) => (
              <img
                key={sessionUser.id}
                src={sessionUser.avatar || '/assets/app/default/avatar.webp'}
                alt={sessionUser.username}
                className={`w-8 h-8 rounded-full border-2 ${
                  isUserInActiveChat(sessionUser.id)
                    ? 'border-green-500'
                    : 'border-gray-500'
                }`}
                title={sessionUser.username}
              />
            ))
          ) : (
            <div className="text-xs text-zinc-400">
              {activeGlobalChatUsers.length} controller{activeGlobalChatUsers.length !== 1 ? 's' : ''} online
            </div>
          )}
        </div>
      </div>

      {/* Session Chat Messages */}
      {activeTab === 'session' && (
        <div
          className={`flex-1 ${
            messages.length > 0 ? 'overflow-y-auto' : ''
          } px-5 py-4 space-y-4`}
          onScroll={handleScroll}
        >
          {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader />
          </div>
        ) : errorMessage ? (
          <div className="flex justify-center items-center h-full text-red-400">
            {errorMessage}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            No messages yet.
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showHeader =
              !prevMsg ||
              prevMsg.userId !== msg.userId ||
              new Date(msg.sent_at).getTime() -
                new Date(prevMsg.sent_at).getTime() >=
                60000;
            const isOwn = String(msg.userId) === String(user?.userId);
            const isMentioned =
              msg.mentions &&
              Array.isArray(msg.mentions) &&
              msg.mentions.includes(user?.userId || '');

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 relative ${
                  isOwn ? 'justify-end' : ''
                } ${isMentioned ? 'bg-blue-900/20 rounded-lg p-2 -m-2' : ''}`}
                onMouseEnter={() => setHoveredMessage(msg.id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                {showHeader && !isOwn && (
                  <img
                    src={msg.avatar || '/assets/app/default/avatar.webp'}
                    alt={msg.username}
                    className="w-9 h-9 rounded-full border-2 border-blue-700 shadow"
                  />
                )}
                {!showHeader && !isOwn && <div className="w-9 h-9" />}
                <div className={`${isOwn ? 'text-right' : ''} relative group`}>
                  {showHeader && (
                    <div className="text-xs text-gray-400 mb-1">
                      <span className="font-semibold text-blue-300">
                        {msg.username}
                      </span>
                      {' • '}
                      {new Date(msg.sent_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  <div
                    className={`rounded-l-2xl rounded-tr-2xl px-3 py-2 text-sm shadow relative ${
                      isOwn
                        ? 'bg-blue-800 text-white ml-auto max-w-[19rem]'
                        : 'bg-zinc-800 text-white max-w-[19rem]'
                    } break-words overflow-wrap-anywhere`}
                    style={
                      isOwn
                        ? {
                            borderTopRightRadius: '1rem',
                            borderBottomRightRadius: '0rem',
                          }
                        : {
                            borderTopLeftRadius: '1rem',
                            borderBottomLeftRadius: '0rem',
                            borderBottomRightRadius: '1rem',
                          }
                    }
                  >
                    <div
                      className="break-words whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: renderMessage(msg.message),
                      }}
                    />

                    {hoveredMessage === msg.id && (
                      <div className="absolute -top-2 -right-2 flex space-x-1">
                        {!isOwn && (
                          <button
                            className="bg-zinc-700 hover:bg-yellow-600 text-gray-300 hover:text-white rounded-full p-1.5 shadow-lg transition-colors duration-200"
                            onClick={() => handleReport(msg.id)}
                            title="Report message"
                          >
                            <Flag className="h-3 w-3" />
                          </button>
                        )}
                        {isOwn && (
                          <button
                            className="bg-zinc-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-full p-1.5 shadow-lg transition-colors duration-200"
                            onClick={() => handleDelete(msg.id)}
                            title="Delete message"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {isOwn && automoddedMessages.has(msg.id) && (
                    <div className="relative group inline-block ml-2">
                      <img
                        src="/assets/images/automod.webp"
                        alt="Flagged by automod"
                        className="w-4 h-4 cursor-help"
                      />
                      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-[9999] whitespace-nowrap">
                        <div className="relative p-[1px] rounded-lg bg-gradient-to-r from-red-600 to-orange-600">
                          <div className="px-3 py-1.5 bg-zinc-900/95 backdrop-blur-md rounded-lg">
                            <div className="text-xs text-white">
                              Automod flagged this for <span className="text-yellow-300 font-semibold">{automoddedMessages.get(msg.id)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {!showHeader && isOwn && <div className="w-9 h-9" />}
                {showHeader && isOwn && (
                  <img
                    src={msg.avatar || '/assets/app/default/avatar.webp'}
                    alt={msg.username}
                    className="w-9 h-9 rounded-full border-2 border-blue-700 shadow"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      )}

      {/* Global Chat Messages */}
      {activeTab === 'pfatc' && (
        <div
          className={`flex-1 ${
            globalMessages.length > 0 ? 'overflow-y-auto' : ''
          } px-5 py-4 space-y-4`}
        >
          {globalLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader />
            </div>
          ) : globalMessages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            globalMessages.map((msg, index) => {
              const prevMsg = index > 0 ? globalMessages[index - 1] : null;
              const showHeader =
                !prevMsg ||
                prevMsg.userId !== msg.userId ||
                new Date(msg.sent_at).getTime() -
                  new Date(prevMsg.sent_at).getTime() >=
                  60000;
              const isOwn = String(msg.userId) === String(user?.userId);
              const isAutomodded = automoddedMessages.has(msg.id);

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 relative ${
                    isOwn ? 'justify-end' : ''
                  }`}
                  onMouseEnter={() => setHoveredMessage(msg.id)}
                  onMouseLeave={() => setHoveredMessage(null)}
                >
                  {showHeader && !isOwn && (
                    <img
                      src={msg.avatar || '/assets/app/default/avatar.webp'}
                      alt={msg.username || 'User'}
                      className="w-9 h-9 rounded-full border-2 border-blue-700 shadow"
                    />
                  )}
                  {!showHeader && !isOwn && <div className="w-9 h-9" />}
                  <div className={`${isOwn ? 'text-right' : ''} relative group`}>
                    {showHeader && (
                      <div className="text-xs text-gray-400 mb-1">
                        <span className="font-semibold text-blue-300">
                          {msg.username || 'Unknown'}
                        </span>
                        {msg.station && msg.position && (
                          <span className="text-green-400">
                            {' - '}{msg.station}_{msg.position}
                          </span>
                        )}
                        {' • '}
                        {new Date(msg.sent_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                    <div className="relative">
                      <div
                        className={`inline-block px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-white'
                        } ${
                          isAutomodded ? 'opacity-50' : ''
                        } break-words max-w-md`}
                        dangerouslySetInnerHTML={{ __html: renderMessage(msg.message) }}
                      />
                      {isAutomodded && (
                        <div className="text-xs text-red-400 mt-1">
                          {automoddedMessages.get(msg.id)}
                        </div>
                      )}
                      {hoveredMessage === msg.id && isOwn && (
                        <div className="absolute -left-14 top-0 flex gap-1">
                          <button
                            onClick={() => handleGlobalDelete(msg.id)}
                            className="p-2 bg-red-600/80 hover:bg-red-600 rounded-full transition-colors"
                            title="Delete message"
                          >
                            <Trash className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {!showHeader && isOwn && <div className="w-9 h-9" />}
                  {showHeader && isOwn && (
                    <img
                      src={msg.avatar || '/assets/app/default/avatar.webp'}
                      alt={msg.username || 'User'}
                      className="w-9 h-9 rounded-full border-2 border-blue-700 shadow"
                    />
                  )}
                </div>
              );
            })
          )}
          <div ref={globalMessagesEndRef} />
        </div>
      )}

      <div className="p-5 border-t border-blue-800 bg-zinc-900 rounded-bl-3xl relative">
        <div className="relative">
          {/* Session Chat Input */}
          {activeTab === 'session' && (
            <>
              {showMentionSuggestions && mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-800 border border-blue-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {mentionSuggestions.map((suggestedUser, index) => (
                    <button
                      key={suggestedUser.id}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-600/20 text-left ${
                        index === selectedSuggestionIndex ? 'bg-blue-600/40' : ''
                      }`}
                      onClick={() => insertMention(suggestedUser.username)}
                    >
                      <img
                        src={
                          suggestedUser.avatar || '/assets/app/default/avatar.webp'
                        }
                        alt={suggestedUser.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium">{suggestedUser.username}</span>
                        {suggestedUser.position && (
                          <span className="text-xs text-gray-400">{suggestedUser.position}</span>
                        )}
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isUserInActiveChat(suggestedUser.id)
                            ? 'bg-green-400'
                            : 'bg-gray-400'
                        }`}
                      ></div>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                className="w-full bg-zinc-800 text-white px-4 py-2 pr-12 rounded-xl border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (showMentionSuggestions) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedSuggestionIndex(
                        (prev) => (prev + 1) % mentionSuggestions.length
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedSuggestionIndex((prev) =>
                        prev === 0 ? mentionSuggestions.length - 1 : prev - 1
                      );
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (selectedSuggestionIndex >= 0) {
                        insertMention(
                          mentionSuggestions[selectedSuggestionIndex].username
                        );
                      }
                    } else if (e.key === 'Escape') {
                      setShowMentionSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }
                  } else {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    } else if (e.key === 'Escape') {
                      setShowMentionSuggestions(false);
                    }
                  }
                }}
                maxLength={500}
                rows={3}
                placeholder="Type a message... Use @ to mention users"
                aria-label="Type a message"
              />

              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 bottom-4 rounded-full px-3 py-1"
                onClick={sendMessage}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Global Chat Input */}
          {activeTab === 'pfatc' && (
            <>
              {showGlobalMentionSuggestions && globalMentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-800 border border-blue-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {globalMentionSuggestions.map((suggestedUser, index) => (
                    <button
                      key={suggestedUser.id}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-600/20 text-left ${
                        index === selectedGlobalSuggestionIndex ? 'bg-blue-600/40' : ''
                      }`}
                      onClick={() => insertGlobalMention(suggestedUser.username)}
                    >
                      <img
                        src={
                          suggestedUser.avatar || '/assets/app/default/avatar.webp'
                        }
                        alt={suggestedUser.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium">{suggestedUser.username}</span>
                        {suggestedUser.position && (
                          <span className="text-xs text-gray-400">{suggestedUser.position}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={globalTextareaRef}
                className="w-full bg-zinc-800 text-white px-4 py-2 pr-12 rounded-xl border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={globalInput}
                onChange={(e) => handleGlobalInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (showGlobalMentionSuggestions) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedGlobalSuggestionIndex(
                        (prev) => (prev + 1) % globalMentionSuggestions.length
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedGlobalSuggestionIndex(
                        (prev) =>
                          (prev - 1 + globalMentionSuggestions.length) %
                          globalMentionSuggestions.length
                      );
                    } else if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (selectedGlobalSuggestionIndex >= 0) {
                        insertGlobalMention(
                          globalMentionSuggestions[selectedGlobalSuggestionIndex].username
                        );
                      }
                    } else if (e.key === 'Escape') {
                      setShowGlobalMentionSuggestions(false);
                    }
                  } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendGlobalMessage();
                  }
                }}
                maxLength={500}
                rows={3}
                placeholder="Type a message... Use @ICAO for airport mentions, @username for user mentions"
                aria-label="Type a global message"
              />

              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 bottom-4 rounded-full px-3 py-1"
                onClick={sendGlobalMessage}
                disabled={!globalInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report Message"
        variant="danger"
        icon={<Flag />}
        footer={
          <Button onClick={handleSubmitReport} variant="danger">
            Report
          </Button>
        }
      >
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Enter reason for reporting..."
          className="w-full p-2 bg-zinc-800 text-white rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-800"
          maxLength={200}
          rows={4}
        />
      </Modal>

      {/* Add this at the end of the return statement, before the closing </div> */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
