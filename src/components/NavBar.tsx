import mcblLogo from "../assets/mcbl_logo.png";
import { NavLink } from "react-router-dom";
const NavBar = () => {
  return (
    <header
      className="
    w-full
    max-w-none
    mx-auto
    items-center
    px-[clamp(24px,8vw,144px)]
    flex flex-row
    justify-between
    font-sans
    box-border
    p-4
    bg-white
    z-100
  "
    >
      <img className="w-[100px] rounded-lg" src={mcblLogo}></img>
      <div className="flex gap-12 justify-between">
        <NavLink to="/" end>
          <span className="text-text-secondary text-xl font-medium">Game</span>
        </NavLink>
        <NavLink to="/leaderboards" end>
          <span className="text-text-secondary text-xl font-medium">Leaderboards</span>
        </NavLink>
        <NavLink to="/records" end>
          <span className="text-text-secondary text-xl font-medium">Records</span>
        </NavLink>
      </div>
      <div></div>
    </header>
  );
};

export default NavBar;
