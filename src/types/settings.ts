export interface BackgroundImageSettings {
    selectedImage: string | null;
    useCustomBackground: boolean;
    favorites: string[];
    stripOpacity: number;
}

export interface SoundSettings {
    enabled: boolean;
    volume: number; // 10 to 200%
}

export interface Settings {
    backgroundImage: BackgroundImageSettings;
    sounds: {
        startupSound: SoundSettings;
        chatNotificationSound: SoundSettings;
        newStripSound: SoundSettings;
    };
}