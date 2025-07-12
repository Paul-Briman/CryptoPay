import { Button } from "./ui/button";
import { MessageCircle } from "lucide-react";

export function SupportChat() {
  const handleChatClick = () => {
    window.open("https://wa.me/18653565182", "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleChatClick}
        className="crypto-bg-success text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-600 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="font-medium">Support Chat</span>
      </Button>
    </div>
  );
}
