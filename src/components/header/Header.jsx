import { useAuthContext } from "../../hooks/useAuthContext"; // ✅ correct
import { useNavigate } from "react-router-dom";
import allsaintsmat from "./allsaintsmat.JPG";
import './Header.css';

function Header() {
  const { auth, isAdmin, isViewOnly, isAdminPlus, prefixes, selectedPrefix, setSelectedPrefix } = useAuthContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedPrefix(value);
    const pathname = value ? `/${value}/asset` : "/";
    navigate({ pathname });
  };

const signOutRedirect = async () => {
  await auth.removeUser();

  const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const domain = import.meta.env.VITE_COGNITO_DOMAIN;

  window.location.href =
    `https://${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
};



  if (auth.isLoading) return <p>Loading...</p>;
  if (auth.error) return <p>Error: {auth.error.message}</p>;

  return (
    <header className="Header">
      <div className="InfoBox">
        <select className="SiteSelector" value={selectedPrefix} onChange={handleChange}>
          {prefixes.map((prefix) => (
            <option key={prefix} value={prefix}>{prefix}</option>
          ))}
        </select>
      </div>

      <div className="LogoAndTitle">
        <img src={allsaintsmat} alt="All Saints MAT Logo" className="Logo" />
        <div className="Title">ASSET REGISTER</div>
      </div>

      <div className="InfoBox">
        <div className="InfoSubtitle">
          {isAdmin && "Admin"}
          {isAdminPlus && "Admin Plus"}
          {isViewOnly && "View Only"}
        </div>
        <button className="SignOutButton" onClick={signOutRedirect}>Sign Out</button>
      </div>
    </header>
  );
}

export default Header;