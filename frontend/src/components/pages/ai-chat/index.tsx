import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/shared/ui-elements/button";
import { Input } from "@/components/shared/ui-elements/input";
import { Card } from "@/components/shared/ui-elements/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shared/ui-elements/avatar";
import { ChevronLeft, ArrowUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAiChat } from "./hooks/useAiChat";
import { ChatMessage } from "@/stores/ai-chat";

/**
 * 防災AIとのチャットページ
 */
export const EmergencyChatPage = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const { messages, isLoading, error, sendMessage } = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 予測される質問
  const predefinedQuestions = [
    {
      japanese: "今すぐ避難すべきですか？",
      english: "Should I evacuate right now?",
    },
    {
      japanese: "ボランティアに参加したいのですがどうしたらいいですか？",
      english:
        "I want to participate in volunteer activities, what should I do?",
    },
    {
      japanese: "津波警報が出た場合、どこまで逃げれば安全ですか？",
      english:
        "If a tsunami warning is issued, how far should I escape to be safe?",
    },
    {
      japanese: "ガスが止まった時で火を使わない料理を教えて",
      english:
        "The gas has been shut off, please tell me some meals that don't require fire.",
    },
    {
      japanese: "家族や知人と連絡が取れない時にできることは？",
      english:
        "What can I do when I cannot contact my family or acquaintances?",
    },
  ];

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
  };

  const handleSend = async () => {
    if (inputValue.trim() && !isLoading) {
      await sendMessage(inputValue);
      setInputValue("");
    }
  };

  const isMobile = useIsMobile();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 mb-3 bg-white border-b border-gray-100">
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-0 h-auto text-gray-600"
          onClick={() => {
            navigate("/");
          }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>マップに戻る</span>
        </Button>
        <span className="text-gray-500 text-sm">ステータスなし</span>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 bg-white min-h-screen">
        {/* チャット履歴がない場合の初期画面 */}
        {messages.length === 0 ? (
          <>
            {/* Title */}
            <div className="mb-6">
              <h1
                className="text-xl font-bold text-gray-900 mb-2"
                style={{
                  fontSize: isMobile ? "16px" : "24px",
                }}
              >
                知りたいことを質問してください
              </h1>
              <p className="text-gray-600 text-sm">
                Please ask what you want to know
              </p>
            </div>

            {/* Predefined Questions */}
            <div className="space-y-4 mb-6">
              {predefinedQuestions.map((question, index) => (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                  onClick={() => handleQuestionClick(question.japanese)}
                >
                  <p className="text-gray-900 font-medium mb-1">
                    {question.japanese}
                  </p>
                  <p className="text-gray-600 text-sm">{question.english}</p>
                </Card>
              ))}
            </div>
          </>
        ) : (
          /* チャット履歴の表示 */
          <div className="space-y-4 pb-6">
            {messages.map((message: ChatMessage) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === "user"
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  } rounded-2xl px-4 py-3`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src="/friendly-chat-bot-avatar.png" />
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          🤖
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">防災AI</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-teal-100"
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* ローディングインジケーター */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">考え中...</span>
                </div>
              </div>
            )}

            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 自動スクロール用の要素 */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="質問を入力してください"
            className="flex-1 rounded-full bg-gray-100 border-0 px-4 py-3"
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-full bg-teal-500 hover:bg-teal-600 w-12 h-12 disabled:opacity-50"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Home Indicator */}
        <div className="flex justify-center mt-4">
          <div className="w-32 h-1 bg-black rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
