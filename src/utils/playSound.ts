import type { Settings } from "../types/settings";

export function playSound(filepath: string, volume: number = 0.7): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const audio = new Audio(filepath);
            audio.volume = Math.max(0, Math.min(1, volume));
            audio.preload = 'auto';
            
            const onCanPlay = () => {
                audio.removeEventListener('canplay', onCanPlay);
                audio.removeEventListener('error', onError);
                resolve();
            };
            
            const onError = (error: Event) => {
                audio.removeEventListener('canplay', onCanPlay);
                audio.removeEventListener('error', onError);
                console.warn('Could not play sound:', filepath, error);
                reject(error);
            };
            
            audio.addEventListener('canplay', onCanPlay);
            audio.addEventListener('error', onError);
            
            audio.play().catch(onError);
        } catch (error) {
            console.warn('Could not create audio element for:', filepath, error);
            reject(error);
        }
    });
}

export function playSoundWithSettings(
    soundType: 'startupSound' | 'chatNotificationSound' | 'newStripSound',
    userSettings: Settings,
    fallbackVolume: number = 0.7
): Promise<void> {
    const soundSettings = userSettings?.sounds?.[soundType];
    
    if (!soundSettings?.enabled) {
        return Promise.resolve();
    }
    
    const volume = (soundSettings.volume || 100) / 100;
    const adjustedVolume = Math.max(0, Math.min(1, volume * fallbackVolume));
    
    const soundMap = {
        startupSound: SOUNDS.SESSION_STARTUP,
        chatNotificationSound: SOUNDS.CHAT_NOTIFICATION,
        newStripSound: SOUNDS.NEW_STRIP
    };
    
    return playSound(soundMap[soundType], adjustedVolume);
}

export function preloadSound(filepath: string): HTMLAudioElement {
    const audio = new Audio(filepath);
    audio.preload = 'auto';
    return audio;
}

export function playSounds(sounds: Array<{ filepath: string; volume?: number }>): Promise<void[]> {
    return Promise.all(sounds.map(sound => playSound(sound.filepath, sound.volume)));
}

export const SOUNDS = {
    CHAT_NOTIFICATION: '/assets/app/sounds/chatNotification.wav',
    SESSION_STARTUP: '/assets/app/sounds/startup.mp3',
    NEW_STRIP: '/assets/app/sounds/newStrip.mp3'
} as const;