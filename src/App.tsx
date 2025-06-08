import ScorePage from "./views/ScorePage";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ScorePage />} />
      </Route>
    </Routes>
  );
}

export default App;
