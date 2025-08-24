import { AI_AGENT_SERVER_URL } from "@/constants/env";

/** チャットリクエストの型定義 */
export interface ChatRequest {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/** チャットレスポンスの型定義 */
export interface ChatResponse {
  response: string;
  model: string;
}

export class AiChatApi {
  private constructor() {}

  /**
   * AIチャットを送信する
   * @param message メッセージ
   * @returns AIからの応答
   */
  static async sendMessage(message: string): Promise<ChatResponse> {
    const request: ChatRequest = {
      prompt: message,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    };

    const response = await fetch(`${AI_AGENT_SERVER_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${errorText}`);
    }

    return response.json() as Promise<ChatResponse>;
  }
}
