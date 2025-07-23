import mcblLogo from "../assets/MCBL_web_logo.png";
import { NavLink } from "react-router-dom";
const NavBar = () => {
  return (
    <header
      className="
    sticky top-0 left-0
    w-full
    items-center
    px-6
    lg:px-[8vw]
    flex flex-row
    justify-between
    font-sans
    box-border
    p-4
    bg-white
    z-100
  "
    >
      <img className="w-12 md:w-24" src={mcblLogo}></img>
      <div className="flex gap-6 lg:gap-12 justify-between">
        <NavLink to="/" end>
          {({ isActive }) => (
            <div className="flex flex-col items-center">
              <span className="text-text-secondary text-xs lg:text-xl font-medium">Game</span>
              <div
                className={`w-full h-[1px] mt-[4px] bg-text-primary transform origin-left  transition-transform duration-300 ease-in-out ${
                  isActive ? "opacity-100 scale-x-100" : "scale-x-0 opacity-0"
                }`}
              ></div>
            </div>
          )}
        </NavLink>
        <NavLink to="/leaderboards" end>
          {({ isActive }) => (
            <div className="flex flex-col items-center">
              <span className="text-text-secondary text-xs lg:text-xl font-medium">Leaderboards</span>
              <div
                className={`w-full h-[1px] mt-[4px] bg-text-primary transform origin-left  transition-transform duration-300 ease-in-out ${
                  isActive ? "opacity-100 scale-x-100" : "scale-x-0 opacity-0"
                }`}
              ></div>
            </div>
          )}
        </NavLink>
        <NavLink to="/records" end>
          {({ isActive }) => (
            <div className="flex flex-col items-center">
              <span className="text-text-secondary text-xs lg:text-xl font-medium">Records</span>
              <div
                className={`w-full h-[1px] mt-[4px] bg-text-primary transform origin-left transition-transform duration-300 ease-in-out ${
                  isActive ? "opacity-100 scale-x-100" : "scale-x-0 opacity-0"
                }`}
              ></div>
            </div>
          )}
        </NavLink>
      </div>
      <div></div>
    </header>
  );
};

export default NavBar;
