import { useAtom } from "jotai";
import { useCallback } from "react";
import { AiChatApi } from "@/apis/aiChatApi";
import {
  chatMessagesAtom,
  isSendingAtom,
  chatErrorAtom,
  clearChatAtom,
  addMessageAtom,
} from "@/stores/ai-chat";

export const useAiChat = () => {
  const [messages] = useAtom(chatMessagesAtom);
  const [isLoading, setIsLoading] = useAtom(isSendingAtom);
  const [error, setError] = useAtom(chatErrorAtom);
  const [, clearChat] = useAtom(clearChatAtom);
  const [, addMessage] = useAtom(addMessageAtom);

  /**
   * メッセージを送信する
   * @param content メッセージ内容
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) {
        return;
      }

      setError(null);
      setIsLoading(true);

      // ユーザーメッセージを追加
      addMessage({
        role: "user",
        content: content.trim(),
      });

      try {
        // AIにメッセージを送信
        const response = await AiChatApi.sendMessage(content.trim());

        // AIの応答を追加
        addMessage({
          role: "assistant",
          content: response.response,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "メッセージの送信に失敗しました";
        setError(errorMessage);
        console.error("Failed to send message:", error);

        // エラーメッセージを追加
        addMessage({
          role: "assistant",
          content: `エラー: ${errorMessage}`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, addMessage, setError, setIsLoading]
  );

  /**
   * チャット履歴をクリアする
   */
  const clear = useCallback(() => {
    clearChat();
  }, [clearChat]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat: clear,
  };
};
