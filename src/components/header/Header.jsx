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

  const clientId = "1mam54gmn5p75g2u9fafcts8sm";
  const cognitoDomain = "https://eu-west-2opm5uemul.auth.eu-west-2.amazoncognito.com";

  const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI;

  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
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