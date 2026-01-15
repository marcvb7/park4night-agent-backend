# Park4Night Agent API

Agent d'IA basat en Mastra i Claude per consultar llocs per aparcar i acampar de Park4Night.

## Estructura del projecte

```
park4night-agent-def/
├── src/
│   ├── tools/
│   │   └── park4nightTool.ts  # Tool amb dades mock (5 llocs)
│   ├── mastra/
│   │   └── index.ts           # Configuració de l'agent
│   ├── server.ts              # Servidor Express API REST
│   └── test-agent.ts          # Script de prova
├── Dockerfile                 # Docker per Node 20
├── .dockerignore
├── package.json
└── .env                       # Variables d'entorn
```

## API Endpoints

### `GET /health`
Health check del servidor.

**Response:**
```json
{
  "status": "ok",
  "message": "Park4Night Agent API is running"
}
```

### `POST /api/chat`
Endpoint principal per xatejar amb l'agent.

**Request:**
```json
{
  "message": "Busco un càmping tranquil a la Costa Brava"
}
```

**Response:**
```json
{
  "response": "He trobat un càmping excel·lent a la Costa Brava...",
  "timestamp": "2026-01-15T10:13:21.703Z"
}
```

## Desenvolupament Local

### Requisits
- Node.js 20+
- npm
- API Key d'Anthropic

### Instal·lació

1. Clonar el repositori i instal·lar dependències:
```bash
npm install
```

2. Crear fitxer `.env` amb la teva API key:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
LOG_LEVEL=info
```

3. Executar tests:
```bash
npm test
```

4. Iniciar servidor:
```bash
npm start
```

El servidor estarà disponible a `http://localhost:3000`

### Exemple de prova amb curl

```bash
# Health check
curl http://localhost:3000/health

# Chat amb l'agent
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Busco un lloc tranquil prop dels Pirineus"}'
```

## Desplegament a Render

### Opció 1: Node.js Natiu (Recomanat)

1. **Crear compte a Render:** https://render.com

2. **Crear nou Web Service:**
   - Connecta el teu repositori GitHub/GitLab
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Configurar variables d'entorn:**
   - A la secció "Environment", afegeix:
     - `ANTHROPIC_API_KEY`: La teva API key d'Anthropic
     - `LOG_LEVEL`: `info`
     - `PORT`: Render l'assignarà automàticament

4. **Desplegar:**
   - Fes clic a "Create Web Service"
   - Render desplegarà automàticament i et donarà una URL pública

### Opció 2: Docker

1. **Crear nou Web Service amb Docker:**
   - Selecciona "Docker" com a environment
   - Render detectarà el `Dockerfile` automàticament

2. **Configurar variables d'entorn** (igual que l'opció 1)

3. **Desplegar**

### Verificar desplegament

Un cop desplegat, pots provar:

```bash
# Canvia <la-teva-url> per la URL que et doni Render
curl https://<la-teva-url>.onrender.com/health

curl -X POST https://<la-teva-url>.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola!"}'
```

## Limitacions actuals

- **Dades mock:** Actualment usa 5 llocs hardcoded al codi
- **Model:** Usa Claude 3.5 Haiku (ràpid i econòmic)
- **Telemetria:** Warnings de Mastra telemetry (es poden ignorar)

## Següents passos

1. **Afegir base de dades:** PostgreSQL/SQLite per emmagatzemar llocs reals
2. **Script Playwright:** Per fer scraping local de Park4Night i omplir la BD
3. **Més filtres:** Per serveis, ubicació, tipus de lloc, etc.
4. **Frontend:** Interfície web per xatejar amb l'agent
5. **Streaming:** Respostes en temps real amb SSE

## Tecnologies

- **Mastra** (alpha): Framework d'agents IA
- **Anthropic Claude 3.5 Haiku**: Model LLM
- **Express**: Servidor HTTP
- **TypeScript**: Llenguatge
- **tsx**: Executor TypeScript
- **Zod**: Validació de schemas
