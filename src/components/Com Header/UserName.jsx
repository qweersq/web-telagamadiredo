import { useEffect, useState } from "react";
import { Twirl as Hamburger } from "hamburger-react";
import { getUserProfile } from "../../utils/userProfileHelper";

const UserName = ({ isOpen, setOpen, onToggle }) => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.user?.name) {
          setUserName(profile.user.name.split(" ").slice(0, 2).join(" "));
        } else {
          setUserName("");
        }
      } catch (error) {
        setUserName("");
      }
    };
    
    loadUserName();
  }, []);

  return (
    <div className="flex h-9 items-center gap-1 rounded-xl border border-telaga-100 bg-white px-1.5 sm:px-2.5">
      <span className="hidden max-w-[9rem] truncate pl-1 font-montserrat text-sm font-semibold text-telaga-900 sm:inline">
        {userName ? userName : "Guest"}
      </span>
      <div className="flex items-center justify-center">
        <Hamburger
          toggled={isOpen}
          toggle={setOpen}
          size={17}
          color="#15803D"
          onToggle={onToggle}
        />
      </div>
    </div>
  );
};

export default UserName; 