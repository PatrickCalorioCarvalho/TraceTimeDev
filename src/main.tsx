import React from "react";
import ReactDOM from "react-dom/client";
import { Window } from "@tauri-apps/api/window";

import App from "./App";
import Config from "./Config";

async function render() {
  const label = await Window.getCurrent().label; // pega a label da janela
  let Component;
  if (label === "Time") {
    await import("./App.css");
    Component = App;
  } else if (label === "Config") {
    await import("./Config.css");
    Component = Config;
  } else {
    Component = () => <div>Janela desconhecida</div>;
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(<Component />);
}

render();
