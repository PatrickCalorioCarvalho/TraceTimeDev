import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Select from "react-select";

interface Group {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface Issue {
  id: number;
  title: string;
}


const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [entryType, setEntryType] = useState<string>("");

  const [running, setRunning] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string | null>(null);

  const [configOk, setConfigOk] = useState<boolean>(false);

  const checkConfig = async () => {
    try {
      const [url, token, labelsStr, user, userId] =
        await invoke<[string, string, string, string, number]>("load_config");

      const hasLabels = labelsStr && labelsStr.split(",").filter(l => l.trim() !== "").length > 0;

      if (url && token && userId > 0 && user && hasLabels) {
        setConfigOk(true);
        setLabels(labelsStr.split(",").map(l => l.trim()).filter(l => l));
        loadGroups();
      } else {
        setConfigOk(false);
      }
    } catch {
      setConfigOk(false);
    }
  };

  const loadGroups = async () => {
    try {
      const result = await invoke<Group[]>("gitlab_groups");
      setGroups(result);
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
    }
  };

  const loadProjects = async (groupId: number) => {
    try {
      const result = await invoke<Project[]>("gitlab_projects", { groupId });
      setProjects(result);
    } catch (err) {
      console.error("Erro ao carregar projetos:", err);
    }
  };

  const loadIssues = async (projectId: number) => {
    try {
      const result = await invoke<Issue[]>("gitlab_issues", { projectId });
      setIssues(result);
    } catch (err) {
      console.error("Erro ao carregar issues:", err);
    }
  };

  useEffect(() => {
    checkConfig();
    const interval = setInterval(checkConfig, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartStop = () => {
    if (!running) {
      const now = new Date();
      setStartTime(now.toLocaleTimeString());
    }
    setRunning(!running);
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isDisabled ? "#1a1a1a" : "#1a1a1a", // mais escuro se desativado
      borderColor: state.isDisabled ? "#444" : state.isFocused ? "#555" : "#333",
      boxShadow: "none",
      minHeight: "32px",
      fontSize: "0.8rem",
      color: state.isDisabled ? "#666" : "#FFF",
      opacity: state.isDisabled ? 0.7 : 1,
      cursor: state.isDisabled ? "not-allowed" : "default",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#1e1e1e",
      fontSize: "0.8rem",
    }),
    singleValue: (base: any, state: any) => ({
      ...base,
      color: state.isDisabled ? "#666" : "#FFF",
      fontSize: "0.8rem",
    }),
    input: (base: any, state: any) => ({
      ...base,
      color: state.isDisabled ? "#666" : "#FFF",
      fontSize: "0.8rem",
    }),
    placeholder: (base: any, state: any) => ({
      ...base,
      color: state.isDisabled ? "#555" : "#AAA",
      fontSize: "0.8rem",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "#333" : "#1e1e1e",
      color: "#FFF",
      fontSize: "0.8rem",
    }),
  };

  return (
    <div className="popup-container">
      {!configOk && (
        <div className="disabled-warning">
          ⚠️ Configure o GitLab e adicione pelo menos um Label para usar esta tela.
          <button className="retry-btn" onClick={checkConfig}>🔄 Tentar novamente</button>
        </div>
      )}

      {/* Grupo */}
      <div className="selector-group">
        <label>Grupo</label>
        <Select
          options={groups.map(g => ({ value: g.id, label: g.name }))}
          value={groups.find(g => g.id === selectedGroup) ? { value: selectedGroup, label: groups.find(g => g.id === selectedGroup)?.name } : null}
          onChange={(opt) => {
            if (opt && opt.value !== null) {
              setSelectedGroup(opt.value);
              setSelectedProject(null);
              setSelectedIssue(null);
              setProjects([]);
              setIssues([]);
              loadProjects(opt.value);
            }
          }}
          placeholder="Selecione um grupo..."
          isDisabled={!configOk}
          styles={selectStyles}
        />
      </div>

      {/* Projeto */}
      <div className="selector-group">
        <label>Projeto</label>
        <Select
          options={projects.map(p => ({ value: p.id, label: p.name }))}
          value={projects.find(p => p.id === selectedProject) ? { value: selectedProject, label: projects.find(p => p.id === selectedProject)?.name } : null}
          onChange={(opt) => {
            if (opt && opt.value !== null) {
              setSelectedProject(opt.value);
              setSelectedIssue(null);
              setIssues([]);
              loadIssues(opt.value);
            }
          }}
          placeholder="Selecione um projeto..."
          isDisabled={!selectedGroup}
          styles={selectStyles}
        />
      </div>

      {/* Issue */}
      <div className="selector-group">
        <label>Issue</label>
        <Select
          options={issues.map(i => ({ value: i.id, label: i.title }))}
          value={issues.find(i => i.id === selectedIssue) ? { value: selectedIssue, label: issues.find(i => i.id === selectedIssue)?.title } : null}
          onChange={(opt) => {
            if (opt) {
              setSelectedIssue(opt.value);
              setEntryType("");
              
            }
          }}
          placeholder="Selecione uma issue..."
          isDisabled={!selectedProject}
          styles={selectStyles}
        />
      </div>

      {/* Tipo (labels configurados) */}
      <div className="selector-group">
        <label>Tipo de lançamento</label>
        <Select<{ value: string; label: string }, false>
          options={labels.map(l => ({ value: l, label: l }))}
          value={entryType ? { value: entryType, label: entryType } : null}
          onChange={(opt) => {
            if (opt) setEntryType(opt.value);
          }}
          placeholder="Selecione um tipo..."
          // só habilita se houver labels E uma issue selecionada
          isDisabled={labels.length === 0 || selectedIssue === null}
          styles={selectStyles}
        />
      </div>


      {/* Controle de horário */}
      <div className="time-controls">
        <button
          className={`start-stop ${running ? "running" : ""}`}
          onClick={handleStartStop}
          disabled={!configOk}
        >
          {running ? `Parando... (${startTime})` : "Iniciar"}
        </button>
        {startTime && running && <span className="time-indicator">{startTime}</span>}
      </div>
    </div>
  );
};

export default App;
