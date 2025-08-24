import { useNavigate } from "react-router";

export const AiChatSideBtn = () => {
  const navigate = useNavigate();

  return (
    <img
      src="/ai-button/ai-side-button.svg"
      alt="AIチャット"
      className="w-22 h-22"
      onClick={() => {
        navigate("/ai-chat");
      }}
    />
  );
};
