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
        className="bg-yellow-500 text-black px-6 py-3 rounded-full shadow-lg hover:bg-yellow-400 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="font-medium">Support Chat</span>
      </Button>
    </div>
  );
}
