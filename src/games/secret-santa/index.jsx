import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Play from "./pages/Play";
import { useAuth } from "../../lib/AuthContext";

export default function SecretSanta() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route element={<Layout user={user} />}>
        <Route index element={<Play />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  );
}
