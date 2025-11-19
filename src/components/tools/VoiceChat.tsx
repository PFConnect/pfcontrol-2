import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../hooks/auth/useAuth';
import {
  createVoiceChatSocket,
  type VoiceUser,
  type VoiceConnectionState,
} from '../../sockets/voiceChatSocket';
import Button from '../common/Button';
import type { ChatMention } from '../../types/chats';

interface VoiceChatProps {
  sessionId: string;
  accessId: string;
  open: boolean;
  activeTab: string;
  onMentionReceived?: (mention: ChatMention) => void;
  voiceUsers: VoiceUser[];
  setVoiceUsers: (users: VoiceUser[]) => void;
  connectionState: VoiceConnectionState;
  setConnectionState: (state: VoiceConnectionState) => void;
  isInVoice: boolean;
  setIsInVoice: (inVoice: boolean) => void;
}

export default function VoiceChat({
  sessionId,
  accessId,
  voiceUsers,
  setVoiceUsers,
  setConnectionState,
  isInVoice,
  setIsInVoice,
}: VoiceChatProps) {
  const { user } = useAuth();
  const [talkingUsers, setTalkingUsers] = useState<Set<string>>(new Set());
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(
    new Map()
  );
  const [userVolumes, setUserVolumes] = useState<Map<string, number>>(() => {
    try {
      const saved = localStorage.getItem('voice-chat-user-volumes');
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Map(
          Object.entries(parsed).map(([k, v]) => [k, v as number])
        );
      }
    } catch (error) {
      console.warn('Failed to load user volumes from localStorage:', error);
    }
    return new Map();
  });
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const saved = localStorage.getItem('voice-chat-muted');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [isDeafened, setIsDeafened] = useState(() => {
    try {
      const saved = localStorage.getItem('voice-chat-deafened');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const voiceSocketRef = useRef<ReturnType<
    typeof createVoiceChatSocket
  > | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('voice-chat-muted', isMuted.toString());
    } catch (error) {
      console.warn('Failed to save mute state to localStorage:', error);
    }
  }, [isMuted]);

  useEffect(() => {
    try {
      localStorage.setItem('voice-chat-deafened', isDeafened.toString());
    } catch (error) {
      console.warn('Failed to save deafen state to localStorage:', error);
    }
  }, [isDeafened]);

  useEffect(() => {
    if (!sessionId || !accessId || !user || !isInVoice) return;

    voiceSocketRef.current = createVoiceChatSocket(
      sessionId,
      accessId,
      user.userId,
      (users) => {
        setVoiceUsers(users);
        users.forEach((voiceUser) => {
          const savedVolume = userVolumes.get(voiceUser.userId);
          if (savedVolume !== undefined && voiceSocketRef.current) {
            voiceSocketRef.current.setUserVolume(voiceUser.userId, savedVolume);
          }
        });
      },
      (state) => setConnectionState(state),
      (userId) => setTalkingUsers((prev) => new Set([...prev, userId])),
      (userId) =>
        setTalkingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        }),
      (userId, level) =>
        setAudioLevels((prev) => new Map(prev.set(userId, level)))
    );

    return () => {
      if (voiceSocketRef.current) {
        voiceSocketRef.current.cleanup();
        voiceSocketRef.current = null;
      }
    };
  }, [sessionId, accessId, user, isInVoice]);

  useEffect(() => {
    if (!voiceSocketRef.current) return;

    const applyStates = () => {
      if (voiceSocketRef.current) {
        voiceSocketRef.current.setMuted(isMuted);
        voiceSocketRef.current.setDeafened(isDeafened);
      }
    };

    const timer = setTimeout(applyStates, 100);
    return () => clearTimeout(timer);
  }, [isMuted, isDeafened]);

  const joinVoice = () => {
    setIsInVoice(true);
  };

  const leaveVoice = () => {
    if (voiceSocketRef.current) {
      voiceSocketRef.current.leaveVoice();
    }
    setIsInVoice(false);
    setVoiceUsers([]);
    setTalkingUsers(new Set());
    setAudioLevels(new Map());
    setConnectionState({ connected: false, connecting: false, error: null });
  };

  const toggleMute = () => {
    if (voiceSocketRef.current) {
      const newMuted = !isMuted;
      voiceSocketRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  };

  const toggleDeafen = () => {
    if (voiceSocketRef.current) {
      const newDeafened = !isDeafened;
      voiceSocketRef.current.setDeafened(newDeafened);
      setIsDeafened(newDeafened);
      if (newDeafened) {
        setIsMuted(true);
        voiceSocketRef.current.setMuted(true);
      }
    }
  };

  const getAudioLevelBar = (userId: string) => {
    const level = audioLevels.get(userId) || 0;
    const percentage = Math.min(level * 100, 100);

    return (
      <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full transition-all duration-100 ${
            percentage > 70
              ? 'bg-red-400'
              : percentage > 40
                ? 'bg-yellow-400'
                : 'bg-green-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const handleVolumeChange = (userId: string, volume: number) => {
    setUserVolumes((prev) => new Map(prev.set(userId, volume)));
    if (voiceSocketRef.current) {
      voiceSocketRef.current.setUserVolume(userId, volume);
    }
  };

  const handleVolumeSave = (userId: string, volume: number) => {
    try {
      const newVolumes = new Map(userVolumes.set(userId, volume));
      const volumesObj = Object.fromEntries(newVolumes);
      localStorage.setItem(
        'voice-chat-user-volumes',
        JSON.stringify(volumesObj)
      );
    } catch (error) {
      console.warn('Failed to save user volumes to localStorage:', error);
    }
  };

  return (
    <div className="flex-1 px-5 py-4 flex flex-col">
      {!isInVoice ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Phone className="w-16 h-16 text-zinc-600 mb-4" />
          <p className="text-zinc-400 mb-6 text-sm max-w-[12rem]">
            Join voice chat to talk with other controllers in this session
          </p>
          <Button onClick={joinVoice} variant="success">
            Join Voice Chat
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
            {[...voiceUsers]
              .sort((a, b) => {
                if (a.userId === user?.userId) return -1;
                if (b.userId === user?.userId) return 1;
                return a.username.localeCompare(b.username);
              })
              .map((voiceUser) => {
                const isCurrentUser = voiceUser.userId === user?.userId;
                const isTalking = talkingUsers.has(voiceUser.userId);
                const currentVolume = userVolumes.get(voiceUser.userId) || 100;

                return (
                  <div
                    key={voiceUser.userId}
                    className="p-3 rounded-lg transition-colors border-2 bg-zinc-800/30 border-zinc-700/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative">
                        <img
                          src={
                            voiceUser.avatar ||
                            '/assets/app/default/avatar.webp'
                          }
                          alt={voiceUser.username}
                          className={`w-10 h-10 rounded-full border-2 ${
                            isTalking ? 'border-green-400' : 'border-zinc-600'
                          }`}
                        />
                        {voiceUser.isMuted && (
                          <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
                            <MicOff className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {voiceUser.isDeafened && (
                          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                            <VolumeX className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {voiceUser.username}
                          {isCurrentUser && ' (You)'}
                        </div>
                        {isCurrentUser && getAudioLevelBar(voiceUser.userId)}
                      </div>
                    </div>

                    {!isCurrentUser && (
                      <div className="flex items-center gap-2 mt-2">
                        <Volume2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="400"
                          value={currentVolume}
                          onChange={(e) =>
                            handleVolumeChange(
                              voiceUser.userId,
                              parseInt(e.target.value)
                            )
                          }
                          onMouseUp={(e) =>
                            handleVolumeSave(
                              voiceUser.userId,
                              parseInt((e.target as HTMLInputElement).value)
                            )
                          }
                          onTouchEnd={(e) =>
                            handleVolumeSave(
                              voiceUser.userId,
                              parseInt((e.target as HTMLInputElement).value)
                            )
                          }
                          className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer volume-slider"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentVolume / 400) * 100}%, #4a5568 ${(currentVolume / 400) * 100}%, #4a5568 100%)`,
                          }}
                        />
                        <span className="text-xs text-zinc-400 w-8 text-right">
                          {currentVolume}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

            {voiceUsers.length === 0 && (
              <div className="text-center text-zinc-400 text-sm py-8">
                You're alone in voice chat
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={isMuted ? 'danger' : 'outline'}
              size="sm"
              onClick={toggleMute}
              className="flex-1"
              disabled={isDeafened}
            >
              {isMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant={isDeafened ? 'danger' : 'outline'}
              size="sm"
              onClick={toggleDeafen}
              className="flex-1"
            >
              {isDeafened ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={leaveVoice}
              className="flex-1"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
