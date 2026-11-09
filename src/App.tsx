import { Routes, Route } from "react-router-dom";
import StartPage from "@components/StartPage";
import ChatPage from "@components/ChatPage";

const App = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<StartPage />} /> */}
      {/* <Route path="/chat-page" element={<ChatPage />} /> */}
      <Route path="/" element={<ChatPage />} />
    </Routes>
  );
};

export default App;
