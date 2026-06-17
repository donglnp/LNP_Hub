import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";
import Leaderboard from "./pages/Leaderboard";
import Scorers from "./pages/Scorers";
import Profile from "./pages/Profile";
import { loadMyPredictions, reset as resetPredictions } from "./lib/predictions";
import { useAuth } from "../../lib/AuthContext";

export default function WorldCupGame() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) loadMyPredictions(user.id);
    else resetPredictions();
  }, [user?.id]);

  return (
    <Routes>
      <Route element={<Layout user={user} />}>
        <Route index element={<Dashboard user={user} />} />
        <Route path="matches" element={<Matches user={user} />} />
        <Route path="leaderboard" element={<Leaderboard user={user} />} />
        <Route path="scorers" element={<Scorers />} />
        <Route path="profile" element={<Profile user={user} />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  );
}
