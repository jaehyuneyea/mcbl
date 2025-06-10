import ScorePage from "./views/ScorePage";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Leaderboard from "./views/Leaderboard";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ScorePage />} />
        <Route path="/leaderboards" element={<Leaderboard />} />
      </Route>
    </Routes>
  );
}

export default App;
