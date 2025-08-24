import { atom } from "jotai";

/** チャットメッセージの型定義 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/** AIチャットの状態 */
export interface AiChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

/** チャット履歴を保持するAtom */
export const chatMessagesAtom = atom<ChatMessage[]>([]);

/** 送信中フラグを保持するAtom */
export const isSendingAtom = atom<boolean>(false);

/** エラー状態を保持するAtom */
export const chatErrorAtom = atom<string | null>(null);

/** 最後のメッセージIDを生成するためのカウンター */
let messageIdCounter = 0;

/** メッセージIDを生成する関数 */
export const generateMessageId = (): string => {
  messageIdCounter++;
  return `msg-${Date.now()}-${messageIdCounter}`;
};

/** チャット履歴をクリアするAtom */
export const clearChatAtom = atom(
  null,
  (_get, set) => {
    set(chatMessagesAtom, []);
    set(chatErrorAtom, null);
  }
);

/** メッセージを追加するAtom */
export const addMessageAtom = atom(
  null,
  (_get, set, message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
    };
    set(chatMessagesAtom, (prev) => [...prev, newMessage]);
  }
);