# TraceTime

TraceTime é um pequeno aplicativo desktop construído com Tauri (Rust) e React + TypeScript (Vite) para controlar sessões de tempo e enviar lançamentos para issues no GitLab.

## Visão rápida

- Frontend: React + TypeScript (Vite)
- Backend nativo: Rust via Tauri (opera chamadas ao GitLab e persistência local)
- UI: `src/App.tsx`, configurações em `src/Config.tsx`

## Executando em desenvolvimento

Instale dependências e execute o modo dev (desktop via Tauri):

```bash
npm install
npm run tauri dev
```

## Publicar documentação (GitHub Pages)

Esta pasta contém um exemplo de documentação estática em `/docs`. Para publicar no GitHub Pages usando essa pasta:

1. Faça commit e push das alterações para a branch `main`.
2. No repositório GitHub, vá em Settings → Pages.
3. Em "Source" escolha `main` branch e a pasta `/docs`.
4. Salve. A página ficará disponível em `https://<seu-usuario>.github.io/<seu-repo>/`.

Você pode editar `docs/index.html` e `docs/styles.css` se quiser um conteúdo diferente.

## Estrutura útil

- `src/` — código React + UI
- `src-tauri/` — código Rust e bindings Tauri
- `docs/` — página estática para GitHub Pages (documentação)

## Contribuindo

Abra issues ou envie pull requests com melhorias. Para testes locais, rode o app em dev conforme acima.
