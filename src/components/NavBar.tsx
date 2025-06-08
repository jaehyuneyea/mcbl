import mcblLogo from "../assets/mcbl_logo.png";
const NavBar = () => {
  
  return (
    <header
      className="
    w-full
    border-2
    border-black
    max-w-none
    mx-auto
    px-[clamp(24px,8vw,144px)]
    flex flex-row
    justify-center
    font-sans
    box-border
    p-4
    bg-beige
    z-100
  "
    >
      <img 
      className="w-[100px] rounded-lg"
      src={mcblLogo}></img>
    </header>
  );
};

export default NavBar;
