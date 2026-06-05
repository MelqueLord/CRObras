# Frontend quick testing

Steps to quickly verify the client locally:

1. Install dependencies:

```bash
cd client
npm install
```

2. Quick type-check (no build artifacts):

```bash
npm run check
```

3. Start dev server:

```bash
npm run dev
```

4. Open the app at `http://localhost:5173` (or the port reported by Vite).

Manual checks to perform:

- Criar uma obra e verificar se aparece no painel lateral.
- Selecionar uma obra e confirmar que o painel `Atalhos` registra a obra.
- Usar o botão `Fin` no painel `Atalhos` para abrir a aba Financeiro.
- Verificar `localStorage` chave `crobras.recentObras` para persistência.
