import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Select from "react-select";

interface Group { id: number; name: string; }
interface Project { id: number; name: string; }
interface Issue { id: number; title: string; }

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [entryType, setEntryType] = useState<string>("");

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [preview, setPreview] = useState<string>("0s");

  const [configOk, setConfigOk] = useState<boolean>(false);

  // Carrega configuração inicial
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
    } catch (err) { console.error("Erro ao carregar grupos:", err); }
  };

  const loadProjects = async (groupId: number) => {
    try {
      const result = await invoke<Project[]>("gitlab_projects", { groupId });
      setProjects(result);
    } catch (err) { console.error("Erro ao carregar projetos:", err); }
  };

  const loadIssues = async (projectId: number) => {
    try {
      const result = await invoke<Issue[]>("gitlab_issues", { projectId });
      setIssues(result);
    } catch (err) { console.error("Erro ao carregar issues:", err); }
  };

  // Recupera última sessão ao abrir
  useEffect(() => {
    checkConfig();
    invoke<[number, number, number, number, string, string, string] | null>("resume_last_session")
      .then((res) => {
        if (res) {
          const [id, g, p, i, lbl, st, prev] = res;
          if(st === "finalizado") return;
          setSessionId(id);
          setSelectedGroup(g);
          setSelectedProject(p);
          setSelectedIssue(i);
          setEntryType(lbl);
          setStatus(st);
          setPreview(prev);
        }
      });
  }, []);

  // Atualiza preview a cada 10s se rodando
  useEffect(() => {
    console.log("Efeito de atualização de preview acionado.");
    console.log("sessionId:", sessionId, "status:", status);
    if (!sessionId || status !== "runner") return;

    const updatePreview = async () => {
      const previewTime = await invoke<string>("get_session_time", { sessionId });
      console.log("Preview atualizado:", previewTime);
      setPreview(previewTime);
    };

    updatePreview(); // consulta imediata

    const interval = setInterval(updatePreview, 2000);
    return () => clearInterval(interval);
  }, [sessionId, status]);


  const canStart = selectedGroup && selectedProject && selectedIssue && entryType;

  const handleStart = async () => {
    const id = await invoke<number>("start_timer", {
      groupId: selectedGroup,
      projectId: selectedProject,
      issueId: selectedIssue,
      label: entryType,
    });
    if (id > 0) {
      setSessionId(id);
      setStatus("runner");
      const previewTime = await invoke<string>("get_session_time", { sessionId: id });
      setPreview(previewTime);
    }
  };

  const handlePause = async () => {
    if (!sessionId) return;
    await invoke("pause_timer", { sessionId });
    setStatus("pause");
    const previewTime = await invoke<string>("get_session_time", { sessionId });
    setPreview(previewTime);
  };

  const handleResume = async () => {
    if (!sessionId) return;
    await invoke("resume_timer", { sessionId });
    setStatus("runner");
  };

  const handleStop = async () => {
    if (!sessionId) return;
    await invoke("stop_timer", { sessionId });
    setStatus("idle");
    setPreview("0s");
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

      {/* Preview */}
      <div className="time-preview">
        <strong>Tempo:</strong> {preview}
      </div>

      {/* Controle de tempo */}
      <div className="time-controls">
        <button onClick={handleStart} disabled={!canStart || status !== "idle"}>
          Iniciar
        </button>
        <button onClick={handlePause} disabled={status !== "runner"}>
          Pausar
        </button>
        <button onClick={handleResume} disabled={status !== "pause"}>
          Retomar
        </button>
        <button onClick={handleStop} disabled={status !== "pause"}>
          Finalizar
        </button>
      </div>

  
    </div>
  );
};

export default App;
