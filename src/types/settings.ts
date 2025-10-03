export interface BackgroundImageSettings {
    selectedImage: string | null;
    useCustomBackground: boolean;
    favorites: string[];
    stripOpacity: number;
}

export interface Settings {
    backgroundImage: BackgroundImageSettings;
}