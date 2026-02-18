function TechList({ techs }) {
  return (
    <div className="w-full max-w-md">
      {techs.map((tech, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded shadow mb-3 flex justify-between"
        >
          <span> {tech.name}</span>
          <span className="font-bold">⭐ {tech.priority}</span>
        </div>
      ))}
    </div>
  );
}

export default TechList;
