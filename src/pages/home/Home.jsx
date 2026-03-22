import Header from "../../components/header/Header";
import "./Home.css";
import { useAuthContext } from "../../hooks/useAuthContext";
import ItemTiles from "../../components/itemTiles/ItemTiles";
import TableHeaderBar from "../../components/tableHeaderBar/TableHeaderBar";

function Home() {
    const { selectedPrefix } = useAuthContext();
    


  return (
    <div className="Home">
      <Header />
      <ItemTiles prefix={selectedPrefix}/>
      <TableHeaderBar />
    </div>
  );
}

export default Home;
