import { useState } from "react";

function TechForm({ onAdd }) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(1);

  function handleSubmit(e) {
    e.preventDefault();

    if (!name) return;

    onAdd({ name, priority });
    setName("");
    setPriority(1);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md w-full max-w-md mb-6"
    >
      <input
        type="text"
        placeholder="Insira o nome da Tecnologia"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <select
        value={priority}
        onChange={(e) => setPriority(Number(e.target.value))}
        className="w-full p-2 border rounded mb-4"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            Prioridade {n}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="w-full bg-[#33ee81] text-black p-2 rounded hover:bg-[#30cb71]"
      >
        Adicionar
      </button>
    </form>
  );
}

export default TechForm;
