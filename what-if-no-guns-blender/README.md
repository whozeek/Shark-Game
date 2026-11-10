# What If… Every Gun Vanished? (Blender version, 50 seconds)

`what-if-all-guns-vanished-blender.mp4` – a 50-second 3D short rendered with Blender (Cycles), narrated, with music and captions.

- `script.json` / `tts.py` – narration and voiceover (Kokoro TTS), writes `build/timeline.json`
- `scene.py` – builds every 3D set, character and animation with Blender's Python API (`pip install bpy`) and renders frames.
  `python3 scene.py 1 1201` renders all frames; add `--save` to also write a `.blend` file you can open in Blender
- `audio.py` – music, sound effects and voice mix
- `assemble.py` – adds captions, upscales to 1080p and joins video and audio
