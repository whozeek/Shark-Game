// Bundles three.js r187 plus the add-ons the game needs into one global `THREE` (same shape the game already uses).
import * as T from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js';
import {SMAAPass} from 'three/examples/jsm/postprocessing/SMAAPass.js';
import {CopyShader} from 'three/examples/jsm/shaders/CopyShader.js';
import {LuminosityHighPassShader} from 'three/examples/jsm/shaders/LuminosityHighPassShader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
const X=Object.assign({},T,{EffectComposer,RenderPass,ShaderPass,UnrealBloomPass,OutputPass,GTAOPass,SMAAPass,CopyShader,LuminosityHighPassShader,RoomEnvironment});
window.THREE=X;
