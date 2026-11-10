# What If… Every Gun in the World Vanished?

A ~3-minute animated "what if" video: `what-if-all-guns-vanished.mp4` (1080p, 30fps, narrated, with music and captions).

## How it's made
- `script.json` – narration, split into 15 scenes
- `tts.py` – makes the voiceover with Kokoro TTS and writes `build/timeline.json` (when each line is spoken)
- `lib.js` / `scenes.js` – canvas drawing kit (people, cities, maps, effects) and the 15 animated scenes
- `index.html` – the player. Open it in a browser to watch a live, silent preview
- `render.js` – renders frames with Playwright and pipes them into ffmpeg
- `audio.py` – generates the music bed and sound effects, then mixes them under the voice

Rebuild: `python3 tts.py am_michael 1.08 && echo "const TIMELINE = $(cat build/timeline.json);" > build/timeline.js && node render.js out.mp4 && python3 audio.py`, then mux with ffmpeg.
