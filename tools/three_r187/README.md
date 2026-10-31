# three.js r187 single-file bundle

r187 ships only as ES modules, so the game bundles it (plus the post-processing add-ons it uses) into one script that sets `window.THREE`:

    mkdir work && cd work && npm install three@0.187.0 esbuild@0.25
    cp ../tools/three_r187/entry.js entry.js
    ./node_modules/.bin/esbuild entry.js --bundle --minify --format=iife --target=es2019 --outfile=three187.min.js

Result: about 840 KB, exposes THREE.EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass, GTAOPass, SMAAPass, CopyShader, LuminosityHighPassShader and RoomEnvironment.
