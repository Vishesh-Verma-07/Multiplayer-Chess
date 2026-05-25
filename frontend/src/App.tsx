import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Auth } from "./screens/Auth";
import { Game } from "./screens/Game";
import { Landing } from "./screens/Landing";
import { SpectateGame } from "./screens/SpectateGame";
import { SpectateList } from "./screens/SpectateList";

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/spectate" element={<SpectateList />} />
            <Route path="/spectate/:gameId" element={<SpectateGame />} />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
