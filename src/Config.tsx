import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function Config() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("gitlab");
  const [newLabel, setNewLabel] = useState("");

  // Dados do usuário GitLab
  const [gitlabUser, setGitlabUser] = useState("");
  const [gitlabUserId, setGitlabUserId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [savedUrl, savedToken, savedLabels, savedUser, savedUserId] =
          await invoke<[string, string, string, string, number]>("load_config");

        setUrl(savedUrl);
        setToken(savedToken);
        setLabels(savedLabels ? savedLabels.split(",") : []);
        setGitlabUser(savedUser);
        setGitlabUserId(savedUserId);
      } catch {
        console.log("Nenhuma configuração encontrada");
      }
    };
    load();
  }, []);

  const test = async () => {
    try {
      const [username, id] = await invoke<[string, number]>("test_gitlab", {
        url,
        token,
      });
      setGitlabUser(username);
      setGitlabUserId(id);
      setMessage(`Conexão OK! Usuário: ${username} (ID: ${id})`);
    } catch (err) {
      setMessage("Falha ao conectar no GitLab. Verifique URL/Token.");
      setGitlabUser("");
      setGitlabUserId(null);
    }
  };

  const save = async () => {
    const labelsString = labels.join(",");
    await invoke("save_config", {
      url,
      token,
      labels: labelsString,
      gitlabUser,
      gitlabUserId,
    });
    setMessage("Configuração salva com sucesso!");
    setTimeout(() => setMessage(""), 3000);
  };

  const addLabel = () => {
    if (newLabel.trim() !== "" && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  return (
    <div className="container">
      <div className="topbar">
        <button
          className={activeTab === "gitlab" ? "active" : ""}
          onClick={() => setActiveTab("gitlab")}
        >
          GitLab
        </button>
        <button
          className={activeTab === "labels" ? "active" : ""}
          onClick={() => gitlabUserId ? setActiveTab("labels") : null}
          disabled={!gitlabUserId}
        >
          Tipos/Labels
        </button>
      </div>

      <div className="content">
        {activeTab === "gitlab" && (
          <div className="form">
            <div className="form-group">
              <label>URL:</label>
              <input value={url} 
                onChange={(e) => {    
                  setUrl(e.target.value);
                  setGitlabUser("");
                  setGitlabUserId(null);
                }} />
            </div>
            <div className="form-group">
              <label>Access Token:</label>
              <input value={token} 
                onChange={(e) => {
                  setToken(e.target.value);
                  setGitlabUser("");
                  setGitlabUserId(null);
                }} />
            </div>
            <div className="form-group">
              <label>Usuário:</label>
              <input value={gitlabUser} readOnly />
            </div>
            <div className="form-group">
              <label>ID Usuário:</label>
              <input value={gitlabUserId ?? ""} readOnly />
            </div>

            <div className="buttons dual">
              <button
                className={`test-btn ${gitlabUserId ? "ok" : message.includes("Falha") ? "fail" : ""}`}
                onClick={test}
              >
                🔍 Testar
              </button>
              <button onClick={save} disabled={!gitlabUserId}>
                💾 Salvar
              </button>
            </div>
            {message && <p className="success">{message}</p>}
          </div>
        )}

        {activeTab === "labels" && (
          <div className="form">
            <h2>🏷️ Tipos de Tempo</h2>
            <div className="form-group" style={{ display: "flex", gap: "8px" }}>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Novo tipo..."
              />
              <button className="icon-btn add" onClick={addLabel}>
                ➕
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th style={{ width: "50px" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map((label) => (
                    <tr key={label}>
                      <td>{label}</td>
                      <td>
                        <button
                          className="icon-btn remove"
                          onClick={() => removeLabel(label)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="buttons">
              <button onClick={save}>💾 Salvar</button>
            </div>
            {message && <p className="success">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Config;
