export interface ChatMessage {
	id: number;
	userId: string;
	username: string;
	avatar?: string;
	message: string;
	sent_at: string;
}