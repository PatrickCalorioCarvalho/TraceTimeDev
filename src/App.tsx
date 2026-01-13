import React, { useState } from "react";
import "./App.css";

interface Project {
  id: number;
  name: string;
}

interface Issue {
  id: number;
  title: string;
}

const mockProjects: Project[] = [
  { id: 1, name: "Projeto Alpha" },
  { id: 2, name: "Projeto Beta" },
];

const mockIssues: Issue[] = [
  { id: 101, title: "Issue 1" },
  { id: 102, title: "Issue 2" },
];

const App: React.FC = () => {
  const [projects] = useState<Project[]>(mockProjects);
  const [issues] = useState<Issue[]>(mockIssues);
  const [selectedProject, setSelectedProject] = useState<number>(projects[0].id);
  const [selectedIssue, setSelectedIssue] = useState<number>(issues[0].id);
  const [entryType, setEntryType] = useState<string>("dev");
  const [running, setRunning] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string | null>(null);

  const handleStartStop = () => {
    if (!running) {
      const now = new Date();
      setStartTime(now.toLocaleTimeString());
    }
    setRunning(!running);
  };

  return (
    <div className="popup-container">
      {/* Seletor de Projeto */}
      <div className="selector-group">
        <label>Projeto</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(parseInt(e.target.value))}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Seletor de Issue */}
      <div className="selector-group">
        <label>Issue</label>
        <select
          value={selectedIssue}
          onChange={(e) => setSelectedIssue(parseInt(e.target.value))}
        >
          {issues.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title}
            </option>
          ))}
        </select>
      </div>

      {/* Tipo de lançamento */}
      <div className="selector-group">
        <label>Tipo de lançamento</label>
        <select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
          <option value="dev">Desenvolvimento</option>
          <option value="review">Review</option>
          <option value="teste">Teste</option>
        </select>
      </div>

      {/* Controle de horário */}
      <div className="time-controls">
        <button className={`start-stop ${running ? "running" : ""}`} onClick={handleStartStop}>
          {running ? `Parando... (${startTime})` : "Iniciar"}  
        </button>
        {startTime && running && <span className="time-indicator">{startTime}</span>}
      </div>
    </div>
  );
};

export default App;
