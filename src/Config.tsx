import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function Config() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  // Carrega automaticamente ao abrir a tela
  useEffect(() => {
    const load = async () => {
      try {
        const [savedUrl, savedToken] = await invoke<[string, string]>("load_config");
        setUrl(savedUrl);
        setToken(savedToken);
      } catch {
        console.log("Nenhuma configuração encontrada");
      }
    };
    load();
  }, []);

  const save = async () => {
    await invoke("save_config", { url, token });
    setMessage("Configuração salva com sucesso!");
    setTimeout(() => setMessage(""), 3000); // limpa mensagem depois de 3s
  };

  return (
    <div className="container">
      <h2>⚙️ Configuração GitLab</h2>
      <div className="form-group">
        <label>URL:</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Access Token:</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} />
      </div>
      <div className="buttons">
        <button onClick={save}>💾 Salvar</button>
      </div>
      {message && <p className="success">{message}</p>}
    </div>
  );
}

export default Config;
