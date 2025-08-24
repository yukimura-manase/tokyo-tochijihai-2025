import { useState } from "react";
import { Button } from "@/components/shared/ui-elements/button";
import { Input } from "@/components/shared/ui-elements/input";
import { Card } from "@/components/shared/ui-elements/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shared/ui-elements/avatar";
import { ChevronLeft, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * 防災AIとのチャットページ
 */
export const EmergencyChatPage = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");

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

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      // TODO: メッセージを送信する
      console.log("Sending:", inputValue);
      setInputValue("");
    }
  };

  const isMobile = useIsMobile();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100">
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

      {/* Chat Bot Avatar */}
      <div className="relative px-6 pt-6 pb-4 bg-white">
        <div className="absolute right-6 top-4">
          <Avatar className="w-12 h-12 border-2 border-blue-500">
            <AvatarImage src="/friendly-chat-bot-avatar.png" />
            <AvatarFallback className="bg-blue-500 text-white">
              🤖
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-24 bg-white">
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
            className="rounded-full bg-teal-500 hover:bg-teal-600 w-12 h-12"
          >
            <ArrowUp className="w-5 h-5" />
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
