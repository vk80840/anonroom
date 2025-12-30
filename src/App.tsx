import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import GroupsPage from "./pages/GroupsPage";
import JoinGroupPage from "./pages/JoinGroupPage";
import ChatPage from "./pages/ChatPage";
import DirectMessagesPage from "./pages/DirectMessagesPage";
import DMChatPage from "./pages/DMChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/join" element={<JoinGroupPage />} />
          <Route path="/chat/:groupId" element={<ChatPage />} />
          <Route path="/dm" element={<DirectMessagesPage />} />
          <Route path="/dm/:recipientId" element={<DMChatPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
