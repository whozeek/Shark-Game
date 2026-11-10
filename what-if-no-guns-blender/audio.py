import json, numpy as np, soundfile as sf
SR=48000
tl=json.load(open('build/timeline.json')); T=tl['total']; N=int(T*SR)+SR
v,vsr=sf.read('build/voice.wav')
# resample voice 24k->48k (linear)
xs=np.arange(int(len(v)*SR/vsr))/SR*vsr
voice=np.interp(xs,np.arange(len(v)),v)
mix=np.zeros(N); mix[:len(voice)]+=voice*1.0
sc={s['id']:s for s in tl['scenes']}
t=np.arange(N)/SR
def note(f): return 440*2**((f-69)/12)
# music: chord pads, 4 beats per chord, 96 bpm
bpm=92; beat=60/bpm; bar=4*beat
prog_bright=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]   # Am F C G
prog_dark=[[57,60,64],[53,56,60],[50,53,57],[52,56,59]]
music=np.zeros(N)
dark_ranges=[(sc['poof']['start'],sc['poof']['start']+sc['poof']['lines'][1]['start']),(sc['bad']['start'],sc['bad']['start']+sc['bad']['dur'])]
def isdark(x): return any(a<=x<b for a,b in dark_ranges)
nb=int(T/bar)+1
for b in range(nb):
    t0=b*bar; ch=(prog_dark if isdark(t0) else prog_bright)[b%4]
    i0=int(t0*SR); n=int(bar*SR*1.15); i1=min(N,i0+n); tt=np.arange(i1-i0)/SR
    env=np.minimum(1,tt/0.6)*np.exp(-tt/3.5)
    for m in ch+[ch[0]-12]:
        f=note(m); w=np.sin(2*np.pi*f*tt)+0.3*np.sin(2*np.pi*2*f*tt)+0.12*np.sin(2*np.pi*3*f*tt)
        music[i0:i1]+=w*env*0.05
    # soft plucked arpeggio
    for k in range(8):
        tk=t0+k*beat/2; j0=int(tk*SR); j1=min(N,j0+int(SR*0.6)); tt2=np.arange(j1-j0)/SR
        m=ch[k%3]+12; music[j0:j1]+=np.sin(2*np.pi*note(m)*tt2)*np.exp(-tt2*7)*0.035
    # kick on beats 1 & 3
    for k in (0,2):
        tk=t0+k*beat; j0=int(tk*SR); j1=min(N,j0+int(SR*0.25)); tt2=np.arange(j1-j0)/SR
        music[j0:j1]+=np.sin(2*np.pi*(50+80*np.exp(-tt2*30))*tt2)*np.exp(-tt2*14)*0.12
# silence music during suspense right before poof, swell after
ps=sc['poof']['start']; tp=ps+sc['poof']['lines'][1]['start']
gain=np.ones(N)
pre=(t>ps+0.3)&(t<tp); gain[pre]=np.clip(1-(t[pre]-ps-0.3)/1.0,0.15,1)
# ducking under voice
venv=np.abs(np.concatenate([voice,np.zeros(N-len(voice))]))
k=int(SR*0.25); venv=np.convolve(venv,np.ones(k)/k,'same')
duck=1-0.45*np.clip(venv/0.03,0,1)
fade=np.clip(t/2,0,1)*np.clip((T-t)/3,0,1)
mix+=music*gain*duck*fade*1.6
rng=np.random.default_rng(1)
def add(at,sig,g=1):
    i=int(at*SR); j=min(N,i+len(sig)); mix[i:j]+=sig[:j-i]*g
def noise(d): return rng.standard_normal(int(d*SR))
# riser before poof
d=tp-(ps+0.3); tt=np.arange(int(d*SR))/SR
riser=np.sin(2*np.pi*(200+600*(tt/d)**2)*tt)*(tt/d)**2*0.12
add(ps+0.3,riser)
# POOF: noise burst lowpassed + sparkle chimes
def poof(at,g=1):
    n=noise(0.8); tt=np.arange(len(n))/SR
    lp=np.convolve(n,np.ones(40)/40,'same')*np.exp(-tt*6)
    add(at,lp*0.9*g)
    for i,m in enumerate([84,88,91,96]):
        tt2=np.arange(int(0.7*SR))/SR; add(at+0.05+i*0.06,np.sin(2*np.pi*note(m)*tt2)*np.exp(-tt2*6)*0.08*g)
poof(tp,1.6)
# many small poofs on world map
te=ps+sc['poof']['lines'][2]['start']
for i in range(8): poof(te+rng.random()*1.5,0.2)
# whoosh at each scene start
for s in tl['scenes'][1:]:
    n=noise(0.5); tt=np.arange(len(n))/SR; env=np.sin(np.pi*tt/0.5)**2
    add(s['start']-0.25,np.convolve(n,np.ones(60)/60,'same')*env*0.25)
# title boom
tt=np.arange(int(2*SR))/SR; add(0.6,np.sin(2*np.pi*(40+60*np.exp(-tt*8))*tt)*np.exp(-tt*2.5)*0.5)
mix=mix[:int(T*SR)]
mix/=max(1,np.abs(mix).max()/0.95)
sf.write('build/mix.wav',mix.astype(np.float32),SR)
print('ok',len(mix)/SR)
