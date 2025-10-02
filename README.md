Nice — I’ll show you a practical, copy-pasteable workflow using **synesthesiam/opentts**: how to run OpenTTS (Docker), quick **Postman / curl** commands, and a ready-to-run **Node.js Express** server that proxies/generates TTS audio and lets you pick voice by language or character name (examples: English, Hindi, or a specific character like `en-us_mary_ann`). I’ll also show SSML usage and how to discover exact voice IDs from the server.

> Short summary of the important facts you’ll need:
>
> * Run OpenTTS in Docker (per-language images or `:all`). ([GitHub][1])
> * HTTP endpoints: `GET /api/voices` (list/filter voices), `GET /api/tts?voice=...&text=...` (returns `audio/wav`). ([GitHub][1])
> * Voices are addressed as `tts_system:voice` (examples `glow-speak:en-us_mary_ann`, `coqui-tts:en_vctk#p228`). SSML is supported (wrap with `<speak>` and `<voice name="...">`). ([GitHub][1])
> * Example voice for Hindi in OpenTTS samples: `flite:cmu_indic_hin_ab`. Example English voices: `glow-speak:en-us_mary_ann`, `larynx:cmu_rms-glow_tts`. Use `/api/voices` to get exact IDs on your instance. ([Synesthesiam][2])

---

# 1) Run OpenTTS (quick)

Recommended: Docker.

Pull & run (English image example):

```bash
docker pull synesthesiam/opentts:en
docker run -it -p 5500:5500 synesthesiam/opentts:en
```

Want all languages/voices? use `synesthesiam/opentts:all`. You can disable the eSpeak voices with `--no-espeak` or enable WAV caching with `--cache`. After startup visit `http://localhost:5500` and the OpenAPI test page at `http://localhost:5500/openapi/`. ([GitHub][1])

---

# 2) Quick Postman / curl examples

## List voices (so you can pick language/character)

**curl**

```bash
curl http://localhost:5500/api/voices -o voices.json
# or filter:
curl "http://localhost:5500/api/voices?language=hi" -o voices-hi.json
```

**Postman**

* New GET request → `http://localhost:5500/api/voices`
* Optionally add query params like `language=hi` or `tts_name=flite` to filter.

(Voices are returned as JSON keyed by `tts:voice` ids — use those exact ids when requesting TTS). ([GitHub][1])

## Generate TTS (download WAV)

**curl (GET with URL-encoded text)**:

```bash
curl -G \
  --data-urlencode "text=नमस्ते, आप कैसे हैं?" \
  --data-urlencode "voice=flite:cmu_indic_hin_ab" \
  "http://localhost:5500/api/tts" \
  --output hello_hi.wav
```

**English example**:

```bash
curl -G \
  --data-urlencode "text=Hello, this is Mary Ann speaking." \
  --data-urlencode "voice=glow-speak:en-us_mary_ann" \
  "http://localhost:5500/api/tts" \
  --output hello_en.wav
```

**Postman**: Create GET request to `http://localhost:5500/api/tts` and add query params `text` and `voice`; after sending, use Postman’s response save/download to store the binary `.wav`. ([GitHub][1])

---

# 3) Node.js server: step-by-step setup + full code

Goal: a small Express server with:

* `GET /voices` → proxy to OpenTTS `GET /api/voices` (optionally accepts `?language=...` or `?tts_name=...`)
* `POST /speak` → accepts JSON `{ text, voice, cache }` and returns streamed audio (`audio/wav`)

## Prereqs

* Docker (to run OpenTTS)
* Node 18+ and npm

## Steps

1. Create project folder and init:

```bash
mkdir opentts-node && cd opentts-node
npm init -y
npm install express axios dotenv
```

2. Create `server.js` with this code:

```js
// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '1mb' }));

const OPEN_TTS = process.env.OPEN_TTS_URL || 'http://localhost:5500'; // adjust if remote

// Proxy voices (optionally forward query: language, tts_name, locale, gender)
app.get('/voices', async (req, res) => {
  try {
    const response = await axios.get(`${OPEN_TTS}/api/voices`, { params: req.query });
    res.json(response.data);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: 'failed to fetch voices', details: err.message });
  }
});

// Speak: expects JSON { text: string, voice: string, cache?: boolean }
app.post('/speak', async (req, res) => {
  const { text, voice, cache = true } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    // Request the OpenTTS TTS endpoint and stream audio back to client
    const response = await axios.get(`${OPEN_TTS}/api/tts`, {
      params: { text, voice, cache },
      responseType: 'stream',
      // If your OpenTTS requires additional headers, put them here
      // headers: { 'X-My-Header': 'value' }
    });

    // Forward headers (content-type likely audio/wav)
    res.setHeader('Content-Type', response.headers['content-type'] || 'audio/wav');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (err) {
    console.error('TTS error', err?.response?.data || err.message);
    // Try to surface error details
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { message: err.message };
    res.status(status).json({ error: 'TTS failed', details: data });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OpenTTS proxy running on http://localhost:${PORT}`));
```

3. Add a start script to `package.json`:

```json
"scripts": {
  "start": "node server.js"
}
```

4. Run:

```bash
node server.js
# or
npm start
```

5. Test:

* List voices: `GET http://localhost:3000/voices`
* Generate audio (curl using Node proxy):

```bash
curl -X POST http://localhost:3000/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Express proxy","voice":"glow-speak:en-us_mary_ann"}' \
  --output out.wav
```

This server streams the exact bytes returned by OpenTTS, so the client ends up with a playable `out.wav`. (If you prefer MP3, you would need a converter on the server — OpenTTS returns WAV by default). ([GitHub][1])

---

# 4) Choosing voice language / character name (practical)

1. **Query voices**: always call `/api/voices` (or `/api/voices?language=hi`) to see exact IDs available on *your* instance — voice ids are authoritative. Example:

   * `flite:cmu_indic_hin_ab` → a Hindi flite voice.
   * `glow-speak:en-us_mary_ann` → English, character Mary Ann.
   * `coqui-tts:en_vctk#p228` → coqui multi-speaker voice with specific speaker id. ([Synesthesiam][2])

2. **Use the `voice` query param** when calling `/api/tts` (or in `POST /speak` body in the example server). The format is `system:voice` or `system:voice#speaker`. Example (URL-encoded):

```
voice=glow-speak:en-us_mary_ann
voice=flite:cmu_indic_hin_ab
voice=coqui-tts:en_vctk#p228
```

(If you use SSML you can also embed `<voice name="...">` tags inside `<speak>`.) ([GitHub][1])

3. **Language filtering** — if you want “all Hindi voices” do `/api/voices?language=hi`. If you want voices from a specific TTS engine: `/api/voices?tts_name=flite`. The JSON contains `language`, `locale`, `tts_name`, `name`, `gender` so you can build UI pickers using those fields. ([GitHub][1])

---

# 5) SSML examples

Simple SSML with voice-switching:

```text
<speak>
  <voice name="glow-speak:en-us_mary_ann">
    Hello — this is Mary Ann.
  </voice>
  <voice name="flite:cmu_indic_hin_ab">
    नमस्ते — मैं हिन्दी भाषा में बोल रही हूँ।
  </voice>
</speak>
```

When using via GET/POST you must URL-encode the whole SSML string into the `text` param (or include it in the `text` body field in the Node proxy). OpenTTS supports the subset of SSML described in the README (`<speak>`, `<voice>`, `<s>`, `<break>`, `<say-as>`, etc.). ([GitHub][1])

---

# 6) Postman config checklist

* **GET /api/voices** — returns JSON list. Use query params to filter.
* **GET /api/tts?text=...&voice=...** — method GET, add query params (`text` and `voice`), click *Send*, then **Save Response** (binary) to a file like `speech.wav`.
* Or hit your Node Proxy `POST /speak` with JSON `{"text":"...","voice":"..."}` and save the binary response.

---

# 7) Tips & troubleshooting

* If you don’t see expected voices, run the `:all` Docker tag or the language-specific image (e.g., `synesthesiam/opentts:hi`) and then call `/api/voices`. ([GitHub][1])
* Use `--no-espeak` if you want to exclude low-quality eSpeak voices. ([GitHub][1])
* OpenTTS returns WAV (`audio/wav`) by default. If you need MP3, convert server-side (ffmpeg) or client-side. ([GitHub][1])

---

# 8) Handy examples (copy/paste)

**List English voices (curl):**

```bash
curl "http://localhost:5500/api/voices?language=en" -o voices-en.json
```

**Generate a Hindi WAV directly (curl):**

```bash
curl -G \
  --data-urlencode "text=नमस्ते! यह एक परीक्षण है." \
  --data-urlencode "voice=flite:cmu_indic_hin_ab" \
  "http://localhost:5500/api/tts" \
  --output test_hi.wav
```

**Use Node proxy (curl):**

```bash
curl -X POST http://localhost:3000/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from proxy","voice":"glow-speak:en-us_mary_ann"}' \
  --output proxy_en.wav
```

---

If you want, I can:

* Give you a `docker-compose.yml` that runs OpenTTS plus the Node proxy together, or
* Expand the Node example to return MP3 (via ffmpeg) or add a small web UI that lists voices and plays them.

Which of those would you like next?

[1]: https://github.com/synesthesiam/opentts "GitHub - synesthesiam/opentts: Open Text to Speech Server"
[2]: https://synesthesiam.github.io/opentts/ "OpenTTS Voice Samples"
