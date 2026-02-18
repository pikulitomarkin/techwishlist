import { useEffect, useState } from "react";
import TechForm from "./components/TechForm";
import TechList from "./components/TechList";
import { supabase } from "./supabaseClient";

function App() {
  const [techs, setTechs] = useState([]);

  useEffect(() => {
    fetchTechs();
  }, []);

  async function fetchTechs() {
    const { data, error } = await supabase
      .from("tech_wishlist")
      .select("*")
      .order("priority", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setTechs(data);
    }
  }

  async function addTech(tech) {
    const { error } = await supabase.from("tech_wishlist").insert([tech]);

    if (error) {
      console.error(error);
    } else {
      fetchTechs(); // serve para atualizar a lista após inserir
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Tech Wishlist</h1>

      <TechForm onAdd={addTech} />
      <TechList techs={techs} />
    </div>
  );
}

export default App;
