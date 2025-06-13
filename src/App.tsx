import ScorePage from "./views/ScorePage";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Leaderboard from "./views/Leaderboard";
import Record from "./views/Record";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ScorePage />} />
        <Route path="/leaderboards" element={<Leaderboard />} />
        <Route path="/records" element={<Record />} />
      </Route>
    </Routes>
  );
}

export default App;
