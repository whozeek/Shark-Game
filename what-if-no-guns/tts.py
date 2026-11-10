import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
TTS='/tmp/claude-0/tts/'
k = Kokoro(TTS+'kokoro-v1.0.int8.onnx', TTS+'voices-v1.0.bin')
voice = sys.argv[1] if len(sys.argv)>1 else 'am_michael'
speed = float(sys.argv[2]) if len(sys.argv)>2 else 1.0
script = json.load(open('script.json'))
SR=24000
out=[]; timeline=[]; t=0.0
def sil(s): return np.zeros(int(s*SR),dtype=np.float32)
for sc in script:
    start=t; segs=[]; lines=[]
    segs.append(sil(sc['pre'])); t+=sc['pre']
    for text,gap in sc['lines']:
        segs.append(sil(gap)); t+=gap
        a,sr = k.create(text, voice=voice, speed=speed, lang='en-us')
        a=a.astype(np.float32)
        # trim silence
        nz=np.where(np.abs(a)>0.01)[0]
        if len(nz): a=a[max(0,nz[0]-240):nz[-1]+1200]
        d=len(a)/SR
        lines.append({'text':text,'start':round(t-start,3),'end':round(t-start+d,3)})
        segs.append(a); t+=d
    segs.append(sil(sc['post'])); t+=sc['post']
    out+=segs
    timeline.append({'id':sc['id'],'start':round(start,3),'dur':round(t-start,3),'lines':lines})
    print(sc['id'], round(start,1), round(t-start,1), file=sys.stderr)
v=np.concatenate(out)
sf.write('build/voice.wav', v, SR)
json.dump({'total':round(t,3),'scenes':timeline}, open('build/timeline.json','w'), indent=1)
print('TOTAL', t, file=sys.stderr)
