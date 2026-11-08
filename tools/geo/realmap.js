/* ================= Real map: a section of Bridgeport from OpenStreetMap that GROWS as you build routes =================
   Source of this block: tools/geo/realmap.js (injected by tools/geo/inject_real.py between the REALMAP markers; the data block RM_DATA comes from tools/geo/world/bake_real.mjs).
   The baked map is a 3.5 km square cut into 7 x 7 "sectors" of 500 m. A real-map level is an ordinary free-form ('ff') district whose graph is NOT stored but REPLAYED from the baked data:
     ff = {real:1, src:'osm', m:[3500,3500], sc:.6, rm:{steps:[[nine start sectors],[sector],[sector],...]}}
   rmGraph() walks the steps in order and appends nodes, edges, ways, polygons and buildings of each sector. Appending never renumbers anything, so node and edge ids, stops, routes, buses and
   riders stay valid when the city grows; a save stores only the list of sectors that were opened. The world frame is fixed (the whole 3.5 km square), the playable part is the opened sectors;
   everything else is painted as pale unmapped ground. Real = road geometry, street names, water, parks, woods, the positions, sizes, orientations and heights of the buildings that were kept
   (thinned per sector). Approximate = streets are thinned to a node budget, small buildings are dropped, building sizes are enlarged to suit the game's wide roads, land use is guessed from footprints. */
const RM_SC=.6, RM_MAXN=940, RM_REACH=120, RM_CLS=['m','a','s'];
let RMD=null;
function rmInflate(src,n){   // raw deflate (RFC 1951), synchronous, so the level can be built without waiting
  const out=new Uint8Array(n);let op=0,ip=0,bb=0,bc=0;
  const bits=k=>{while(bc<k){bb|=src[ip++]<<bc;bc+=8}const v=bb&((1<<k)-1);bb>>>=k;bc-=k;return v};
  const mk=(lens,cnt0)=>{const cnt=new Uint16Array(16),sym=new Uint16Array(cnt0),off=new Uint16Array(16);for(let i=0;i<cnt0;i++)cnt[lens[i]]++;cnt[0]=0;for(let i=1;i<16;i++)off[i]=off[i-1]+cnt[i-1];for(let i=0;i<cnt0;i++)if(lens[i])sym[off[lens[i]]++]=i;return{cnt,sym}};
  const dec=t=>{let code=0,first=0,idx=0;for(let l=1;l<16;l++){code|=bits(1);const c=t.cnt[l];if(code-c<first)return t.sym[idx+(code-first)];idx+=c;first+=c;first<<=1;code<<=1}throw new Error('inflate')};
  const LB=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],LE=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const DB=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],DE=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  let fl=null,fd=null,last;
  do{last=bits(1);const type=bits(2);
    if(type===0){bb=0;bc=0;const len=src[ip]|src[ip+1]<<8;ip+=4;for(let i=0;i<len;i++)out[op++]=src[ip++];continue}
    let lt,dt;
    if(type===1){
      if(!fl){const l=new Uint8Array(288);for(let i=0;i<144;i++)l[i]=8;for(let i=144;i<256;i++)l[i]=9;for(let i=256;i<280;i++)l[i]=7;for(let i=280;i<288;i++)l[i]=8;fl=mk(l,288);fd=mk(new Uint8Array(30).fill(5),30)}
      lt=fl;dt=fd;
    }else{
      const nl=bits(5)+257,nd=bits(5)+1,nc=bits(4)+4,ord=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],cl=new Uint8Array(19);
      for(let i=0;i<nc;i++)cl[ord[i]]=bits(3);
      const ct=mk(cl,19),lens=new Uint8Array(nl+nd);let i=0;
      while(i<nl+nd){const s=dec(ct);if(s<16)lens[i++]=s;else{let rep,v=0;if(s===16){v=lens[i-1];rep=3+bits(2)}else if(s===17)rep=3+bits(3);else rep=11+bits(7);while(rep--)lens[i++]=v}}
      lt=mk(lens.subarray(0,nl),nl);dt=mk(lens.subarray(nl),nd);
    }
    for(;;){const s=dec(lt);if(s<256)out[op++]=s;else if(s===256)break;else{const si=s-257,len=LB[si]+bits(LE[si]),ds=dec(dt),dist=DB[ds]+bits(DE[ds]);for(let k=0;k<len;k++){out[op]=out[op-dist];op++}}}
  }while(!last);
  return out;
}
function rmData(){
  if(RMD)return RMD;
  const bin=atob(RM_B64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  const J=JSON.parse(new TextDecoder().decode(rmInflate(u8,RM_LEN)));
  const D={nx:J.nx,ny:J.ny,sec:J.sec,st:J.st,o:J.o,names:J.names,src:J.src,nodes:[],edges:[],places:J.pl||[]};
  for(let i=0;i<J.nodes.length;i+=2)D.nodes.push([J.nodes[i],J.nodes[i+1]]);
  const abs=rel=>{const p=[[rel[0],rel[1]]];let x=rel[0],y=rel[1];for(let i=2;i<rel.length;i+=2){x+=rel[i];y+=rel[i+1];p.push([x,y])}return p};
  for(const e of J.edges){let x=D.nodes[e[0]][0],y=D.nodes[e[0]][1];const pts=[];for(let k=5;k<e.length;k+=2){x+=e[k];y+=e[k+1];pts.push([x,y])}D.edges.push({a:e[0],b:e[1],c:e[2]&3,br:(e[2]>>2)&1,n:e[3],s:e[4],pts})}
  D.bySec=Array.from({length:D.nx*D.ny},()=>[]);D.edges.forEach((e,i)=>D.bySec[e.s].push(i));
  D.sectors=J.sectors.map(s=>({w:s.w.map(abs),p:s.p.map(abs),z:s.z.map(abs),b:s.b,l:s.l}));
  return RMD=D;
}
const rmStart=()=>{const D=rmData(),o=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)o.push((D.st[1]+dr)*D.nx+D.st[0]+dc);return o};
const rmUnit=(D,s)=>D.sec*RM_SC;   // sector width in game units
function rmSecRect(D,s){const w=D.sec*RM_SC,c=s%D.nx,r=(s/D.nx)|0;return{x0:MARGIN+c*w,y0:MARGIN+r*w,x1:MARGIN+(c+1)*w,y1:MARGIN+(r+1)*w}}
function rmFFNew(extra){return{real:1,src:'osm',m:[3500,3500],sc:RM_SC,rm:{steps:[rmStart()].concat((extra||[]).map(s=>[s]))},poi:[]}}
/* the replay: nodes, edges and ways of the opened sectors, in a fixed order so ids are stable */
function rmGraph(ff){
  const D=rmData(),sc=ff.sc,nx=D.nx,U=(x,y)=>[MARGIN+x*sc,MARGIN+y*sc];
  const cols=Math.ceil(D.nx*D.sec*sc/S-1e-6),rows=Math.ceil(D.ny*D.sec*sc/S-1e-6);
  const nodes=[],edges=[],ways=[],bnode=new Map(),present=new Set(),exp=new Set(),order=[];
  const nn=(x,y)=>{const p=U(x,y);nodes.push({id:nodes.length,x:p[0],y:p[1],adj:[]});return nodes.length-1};
  const bn=k=>{let v=bnode.get(k);if(v===undefined){v=nn(D.nodes[k][0],D.nodes[k][1]);bnode.set(k,v)}return v};
  const addEdge=bi=>{
    const e=D.edges[bi],cls=RM_CLS[e.c],name=D.names[e.n],ids=[bn(e.a)];
    for(const p of e.pts)ids.push(nn(p[0],p[1]));ids.push(bn(e.b));
    const wi=ways.length;ways.push({name,cls,ids,s:e.s});
    for(let i=0;i+1<ids.length;i++){const a=ids[i],b=ids[i+1],A=nodes[a],B=nodes[b];edges.push({a,b,len:Math.hypot(A.x-B.x,A.y-B.y),cls,name,br:!!e.br,way:wi,s:e.s});A.adj.push(edges.length-1);B.adj.push(edges.length-1)}
    present.add(bi);order.push(bi);
  };
  ff.rm.steps.forEach(batch=>{
    for(const s of batch)exp.add(s);
    const cand=[];for(const s of exp)for(const bi of D.bySec[s])if(!present.has(bi))cand.push(bi);
    cand.sort((a,b)=>a-b);
    if(!nodes.length){   // first batch: the biggest connected piece of the opened sectors becomes the network
      const par=new Map(),find=x=>{while(par.get(x)!==x){par.set(x,par.get(par.get(x)));x=par.get(x)}return x};
      for(const bi of cand){const e=D.edges[bi];for(const k of[e.a,e.b])if(!par.has(k))par.set(k,k);par.set(find(e.a),find(e.b))}
      const w=new Map();for(const bi of cand){const e=D.edges[bi],r=find(e.a);w.set(r,(w.get(r)||0)+1)}
      let best=-1,bw=-1;for(const[r,v]of w)if(v>bw){bw=v;best=r}
      for(const bi of cand)if(find(D.edges[bi].a)===best)addEdge(bi);
    }
    let ch=true;while(ch){ch=false;for(const bi of cand){if(present.has(bi))continue;const e=D.edges[bi];if(bnode.has(e.a)||bnode.has(e.b)){addEdge(bi);ch=true}}}
  });
  // polygons of the opened sectors (clipped to their sectors at bake time)
  const poly=(l,t)=>l.map(p=>{const q=p.map(a=>U(a[0],a[1]));let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const a of q){x0=Math.min(x0,a[0]);x1=Math.max(x1,a[0]);y0=Math.min(y0,a[1]);y1=Math.max(y1,a[1])}const o={p:q,x0,y0,x1,y1};if(t)o.t=t;return o});
  const water=[],parks=[],zones=[],pois=[];let vx0=1e9,vy0=1e9,vx1=-1e9,vy1=-1e9;
  for(const s of exp){const sd=D.sectors[s],R=rmSecRect(D,s);
    water.push(...poly(sd.w));parks.push(...poly(sd.p));zones.push(...poly(sd.z,'.'));
    for(const l of sd.l){const q=U(l[1],l[2]);pois.push({t:l[0],x:q[0],y:q[1],name:l[3]||''})}
    vx0=Math.min(vx0,R.x0);vy0=Math.min(vy0,R.y0);vx1=Math.max(vx1,R.x1);vy1=Math.max(vy1,R.y1)}
  const IB=64,idx=new Map();
  edges.forEach((e,i)=>{const A=nodes[e.a],B=nodes[e.b];for(let cx=Math.floor((Math.min(A.x,B.x)-40)/IB);cx<=Math.floor((Math.max(A.x,B.x)+40)/IB);cx++)for(let cy=Math.floor((Math.min(A.y,B.y)-40)/IB);cy<=Math.floor((Math.max(A.y,B.y)+40)/IB);cy++){const k=cx+','+cy;if(!idx.has(k))idx.set(k,[]);idx.get(k).push(i)}});
  const g={sc,cols,rows,nodes,edges,ways,water,parks,zones,pois,idx,IB,w:MARGIN*2+cols*S,h:MARGIN*2+rows*S,
    rm:{D,exp,bnode,order,rect:{x0:vx0,y0:vy0,x1:vx1,y1:vy1},nexp:exp.size}};
  g.rm.blds=rmBuildings(g,D);
  return g;
}
/* the real buildings of the opened sectors, turned into game buildings: oriented boxes, big ones keep a polygon. Order and tests depend only on earlier sectors, so a rebuild never moves old ones */
function rmBuildings(g,D){
  const out=[],hs=new Map(),HG=50,sc=g.sc;
  const near=(x,y,r)=>{for(let a=Math.floor((x-r-30)/HG);a<=Math.floor((x+r+30)/HG);a++)for(let b=Math.floor((y-r-30)/HG);b<=Math.floor((y+r+30)/HG);b++){const l=hs.get(a+','+b);if(l)for(const o of l)if(Math.hypot(o.x-x,o.y-y)<r+o.r)return true}return false};
  for(const s of g.rm.exp)for(const q of D.sectors[s].b){
    const x=MARGIN+q[0]*sc,y=MARGIN+q[1]*sc,W0=q[2]*sc,D0=q[3]*sc,t=q[6],hm=q[5],ang=q[4]*3*Math.PI/180;
    if(ffIn(g.water,x,y))continue;
    let b;
    if(q[7]){   // a real footprint polygon, a little enlarged (the game's roads are wide)
      const P=q[7],pts=[];for(let i=0;i<P.length;i+=2)pts.push([x+P[i]*sc*1.12,y+P[i+1]*sc*1.12]);
      if(ffClear(g,x,y)<5)continue;
      let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of pts){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}
      b={type:'work',x,y,w:Math.max(24,x1-x0),d:Math.max(22,y1-y0),h:Math.max(18,Math.min(46,10+hm*.8)),poly:pts,ang:0,rm:1};
      const r=.5*Math.max(b.w,b.d)*.7;if(near(x,y,r))continue;
    }else{
      let w,d,h;
      if(t===2){w=Math.max(24,Math.min(66,W0*1.2));d=Math.max(22,Math.min(50,D0*1.2));h=Math.max(18,Math.min(46,12+hm*.8))}
      else if(t===1){w=Math.max(22,Math.min(36,W0*1.35));d=Math.max(20,Math.min(28,D0*1.35));h=20+Math.min(10,hm*.5)}
      else{w=Math.max(15,Math.min(27,W0*1.7));d=Math.max(13,Math.min(22,D0*1.7));h=9+Math.min(5,Math.max(0,hm-3)*.55)}
      if(ffClear(g,x,y)<Math.min(w,d)*.2)continue;
      const r=.5*Math.hypot(w,d)*.58;if(near(x,y,r))continue;
      const Rr=rng((Math.round(x*7)^Math.round(y*13))+11);
      b=t===2?{type:'work',x,y,w,d,h,ang,rm:1,col:pick(Rr,GLASS)}:t===1?{type:'home',kind:'apt',x,y,w,d,h,ang,rm:1,col:pick(Rr,APTS)}:{type:'home',kind:'house',x,y,w,d,h,ang,rm:1,col:pick(Rr,WALLS),roof:pick(Rr,ROOFS)};
    }
    const r=b.poly?.5*Math.max(b.w,b.d)*.7:.5*Math.hypot(b.w,b.d)*.58,k=Math.floor(x/HG)+','+Math.floor(y/HG);if(!hs.has(k))hs.set(k,[]);hs.get(k).push({x,y,r});
    out.push(b);
  }
  return out;
}
/* the coarse land-use letters (H homes, B offices, P park, W water, landmark letters) of the opened sectors; everything else is '.' */
function rmDeriveMap(g){
  const rows=g.rows,cols=g.cols,sc=g.sc,D=g.rm.D,cell=[],cnt=new Map();
  const ck=(x,y)=>Math.floor((x-MARGIN)/S)+','+Math.floor((y-MARGIN)/S);
  for(const b of g.rm.blds){const k=ck(b.x,b.y),o=cnt.get(k)||{h:0,w:0};if(b.type==='work')o.w++;else o.h+=b.kind==='apt'?2:1;cnt.set(k,o)}
  const secW=D.sec*sc/S;   // cells per sector
  for(let r=0;r<rows;r++){let s='';
    for(let c=0;c<cols;c++){
      const sx=Math.floor(c/secW),sy=Math.floor(r/secW);let ch='.';
      if(g.rm.exp.has(sy*D.nx+sx)){
        const bx=MARGIN+c*S,by=MARGIN+r*S;let w=0,pk=0;
        for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x=bx+17+33*i,y=by+17+33*j;if(ffIn(g.water,x,y))w++;else if(ffIn(g.parks,x,y))pk++}
        const o=cnt.get(c+','+r);
        ch=w>=5?'W':(o&&(o.w>=2||o.w*3>=o.h&&o.w>=1))?'B':(o&&(o.h+o.w)>=1)?'H':pk>=5?'P':'.';
      }
      s+=ch}
    cell.push(s.split(''))}
  for(const p of g.pois){const c=Math.floor((p.x-MARGIN)/S),r=Math.floor((p.y-MARGIN)/S);if(cell[r]&&cell[r][c]!==undefined&&cell[r][c]!=='W')cell[r][c]=p.t}
  return cell.map(a=>a.join(''));
}
/* ---------- growth: which sectors can be opened next, how they are named, and the growth itself ---------- */
const RM_DIR=['east','south-east','south','south-west','west','north-west','north','north-east'];
function rmSecName(D,s){
  const c=(s%D.nx+.5)*D.sec,r=((s/D.nx|0)+.5)*D.sec;let best=null,bd=620;
  for(const p of D.places){const d=Math.hypot(p[0]-c,p[1]-r);if(d<bd){bd=d;best=p[2]}}
  if(best)return best.replace(/ Historic District$/,'').replace(/^Bridgeport /,'');
  const cnt=new Map();for(const bi of D.bySec[s]){const n=D.names[D.edges[bi].n];if(n)cnt.set(n,(cnt.get(n)||0)+D.edges[bi].pts.length+1)}
  let nm='',bv=0;for(const[k,v]of cnt)if(v>bv){bv=v;nm=k}
  return nm?'around '+nm:'the next blocks';
}
function rmFrontier(ff){
  const g=ffGraph(ff),D=g.rm.D,ex=g.rm.exp,res=[],seen=new Set();let ax=0,ay=0;
  for(const s of ex){ax+=s%D.nx;ay+=(s/D.nx)|0}ax/=ex.size;ay/=ex.size;
  for(const s of ex){const c=s%D.nx,r=(s/D.nx)|0;
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      if(!dc&&!dr)continue;const c2=c+dc,r2=r+dr;if(c2<0||r2<0||c2>=D.nx||r2>=D.ny)continue;const s2=r2*D.nx+c2;if(ex.has(s2)||seen.has(s2))continue;seen.add(s2);
      let touch=0;for(const bi of D.bySec[s2]){const e=D.edges[bi];if(g.rm.bnode.has(e.a)||g.rm.bnode.has(e.b))touch++}
      if(!touch)continue;
      const ang=Math.atan2(r2-ay,c2-ax),dirI=((Math.round(ang/(Math.PI/4))%8)+8)%8;
      res.push({sec:s2,c:c2,r:r2,touch,tot:D.bySec[s2].length,nb:D.sectors[s2].b.length,dir:RM_DIR[dirI],score:touch*3+D.bySec[s2].length+D.sectors[s2].b.length*.05});
    }}
  res.sort((a,b)=>b.score-a.score||a.sec-b.sec);
  return res;
}
function rmNodeCount(ff){return ffGraph(ff).nodes.length}
function rmGrowChoices(){
  const L=G.L,ff=L.ff,D=rmData(),fr=rmFrontier(ff),out=[],cur=rmNodeCount(ff);
  for(const f of fr){
    if(out.length>=3)break;
    if(cur+D.bySec[f.sec].reduce((a,bi)=>a+D.edges[bi].pts.length+1,0)>RM_MAXN)continue;
    if(out.some(o=>Math.max(Math.abs(o.rc-f.c),Math.abs(o.rr-f.r))<2))continue;
    out.push({rm:1,sec:f.sec,rc:f.c,rr:f.r,c:f.c*3+1,r:f.r*3+1,letter:String.fromCharCode(65+out.length),title:'Open '+f.dir,place:rmSecName(D,f.sec),desc:'Real streets and buildings to the '+f.dir+': about '+f.touch+' roads reach it and '+f.nb+' buildings are mapped.'});
  }
  return out;
}
/* every stop or route near the edge of the opened map asks for the next sector in that direction */
function rmReach(nid){
  const L=G.L;if(!L||!L.ff||!L.ff.real||!G.city||G.over)return;const n=G.city.nodes[nid];if(!n)return;
  const D=rmData();let best=null;
  for(const f of rmFrontier(L.ff)){const R=rmSecRect(D,f.sec),d=Math.hypot(Math.max(R.x0-n.x,0,n.x-R.x1),Math.max(R.y0-n.y,0,n.y-R.y1));if(d<=RM_REACH&&(!best||d<best.d))best={f,d}}
  if(!best)return;
  if(rmNodeCount(L.ff)+D.bySec[best.f.sec].reduce((a,bi)=>a+D.edges[bi].pts.length+1,0)>RM_MAXN){if(!G.rmFullNote){G.rmFullNote=1;toast('The mapped city is as large as this game version builds.',3200)}return}
  if(G.paused&&G.t===0&&!G.modal&&!ui.growOpts&&!ui.rmRev&&!ui.expAnim){setTimeout(()=>{if(G.city&&G.L===L&&G.paused&&!G.modal&&!ui.rmRev&&!ui.growOpts&&L.ff.real&&!L.ff.rm.steps.some(b=>b.indexOf(best.f.sec)>=0))rmGrow(best.f.sec,{why:'reach',name:rmSecName(D,best.f.sec),dir:best.f.dir})},90);return}
  G.rmQ=G.rmQ||[];if(G.rmQ.indexOf(best.f.sec)<0&&G.rmQ.length<2){G.rmQ.push(best.f.sec);toast('Your stop is at the edge of the mapped city. '+rmSecName(D,best.f.sec)+' opens tomorrow.',3600)}
}
function rmScale(L,n){L.perDay=Math.round((L.rmPer0||(L.rmPer0=L.perDay))*Math.pow(1.04,n))}
/* open one sector: rebuild the graph by replay and check that everything old is untouched. Returns false (and changes nothing) if the replay would renumber anything. */
function rmGrow(sec,o){
  o=o||{};const L=G.L;if(!L||!L.ff||!L.ff.real||!G.city)return false;
  const old=L.ff;if(old.rm.steps.some(b=>b.indexOf(sec)>=0))return false;
  const g0=ffGraph(old),nf=Object.assign({},old,{_g:null,rm:{steps:old.rm.steps.map(b=>b.slice()).concat([[sec]])}}),g1=ffGraph(nf);
  for(let i=0;i<g0.nodes.length;i++){const a=g0.nodes[i],b=g1.nodes[i];if(!b||a.x!==b.x||a.y!==b.y){console.warn('real map: growth would renumber nodes');return false}}
  for(let i=0;i<g0.edges.length;i++){const a=g0.edges[i],b=g1.edges[i];if(!b||a.a!==b.a||a.b!==b.b){console.warn('real map: growth would renumber edges');return false}}
  const camBefore={x:cam.x,y:cam.y,zoom:cam.zoom,yaw:cam.yaw,pitch:cam.pitch},D=g1.rm.D,R=rmSecRect(D,sec);
  L.ff=nf;L.map=rmDeriveMap(g1);G.rmN=nf.rm.steps.length-1;rmScale(L,G.rmN);
  G.city=buildCity(L);
  if(T.ok){build3D(G.city);resetDyn()}
  for(const r of G.routes)recalcRoute(r);
  netChanged();
  const nm=o.name||rmSecName(D,sec);
  if(!ui.rm&&T.ok)rmRevealStart(R,camBefore,!!o.fit);else if(o.fit){fitCam(true)}
  toast((o.why==='reach'?'Your route reaches ':'The map grows: ')+nm+'. New streets and buildings are open'+(o.dir?' to the '+o.dir:'')+'.',3600);snd('cheer');
  ui.dirty=true;saveGame();
  return true;
}
function rmDayGrowth(){   // start of a day: open what the stops asked for yesterday
  const q=G.rmQ||[];G.rmQ=[];let n=0;
  for(const s of q){if(rmGrow(s,{why:'reach'}))n++}
  return n;
}
/* reveal: the new sector's buildings rise out of the ground under a pale veil that fades, and the camera eases out to show the larger city */
function rmRevealStart(R,camBefore,fit){
  if(ui.rmRev)rmRevealEnd();
  if(fit){fitCam(true);const z={x:cam.x,y:cam.y,zoom:cam.zoom,yaw:0,pitch:cam.pitch};Object.assign(cam,camBefore);clampCam();updateCamera();ui.camAnim={from:camBefore,to:z,t0:performance.now()+300,dur:1800}}
  else{Object.assign(cam,camBefore)}
  T.r.localClippingEnabled=true;
  const P=[new THREE.Plane(new THREE.Vector3(-1,0,0),R.x0),new THREE.Plane(new THREE.Vector3(1,0,0),-R.x1),new THREE.Plane(new THREE.Vector3(0,0,-1),R.y0),new THREE.Plane(new THREE.Vector3(0,0,1),-R.y1),new THREE.Plane(new THREE.Vector3(0,-1,0),0)];
  const mats=expClipMats();for(const m of mats){m.clippingPlanes=P;m.clipIntersection=true;m.needsUpdate=true}
  if(!T.rmG){T.rmG=new THREE.Group();T.dyn.add(T.rmG)}
  clearGroup(T.rmG);
  const veil=new THREE.Mesh(T.gBox,basic('#d9dfdc',{transparent:true,opacity:.88,depthWrite:false}));veil.scale.set(R.x1-R.x0,.4,R.y1-R.y0);veil.position.set((R.x0+R.x1)/2,1.1,(R.y0+R.y1)/2);veil.renderOrder=7;T.rmG.add(veil);
  const ring=new THREE.Mesh(T.gBox,basic('#3fb868',{transparent:true,opacity:.35,depthWrite:false}));ring.scale.set(R.x1-R.x0,.5,R.y1-R.y0);ring.position.set((R.x0+R.x1)/2,1.3,(R.y0+R.y1)/2);ring.renderOrder=8;T.rmG.add(ring);
  ui.rmRev={t0:performance.now(),dur:3000,mats,P,veil,ring,R};
}
function rmRevealTick(now){
  const a=ui.rmRev;if(!a)return;const t=(now-a.t0)/a.dur;
  if(t>=1){rmRevealEnd();return}
  const e=x=>x<0?0:x>1?1:x*x*(3-2*x);
  a.P[4].constant=Math.max(0,420*e((t-.18)/.7));
  a.veil.material.opacity=.88*(1-e((t-.05)/.5));a.ring.material.opacity=(.18+.12*Math.sin(now/180))*(1-e((t-.6)/.4));
}
function rmRevealEnd(){
  const a=ui.rmRev;if(!a)return;ui.rmRev=null;
  for(const m of a.mats){m.clippingPlanes=null;m.clipIntersection=false;m.needsUpdate=true}
  if(T.rmG)clearGroup(T.rmG);
  ui.dirty=true;
}
/* unopened ground: pale paper with the real water and green areas faintly drawn, and a survey line along the edge of the opened map */
function rmPaintFog(g,city,P){
  const gg=city.ff,D=gg.rm.D,exp=gg.rm.exp,sc=gg.sc,w=D.sec*sc;
  const pg=(l)=>{for(const p of l){g.beginPath();p.forEach((q,i)=>{const X=MARGIN+q[0]*sc,Y=MARGIN+q[1]*sc;i?g.lineTo(X,Y):g.moveTo(X,Y)});g.closePath();g.fill()}};
  for(let s=0;s<D.nx*D.ny;s++){
    if(exp.has(s))continue;const R=rmSecRect(D,s),sd=D.sectors[s];
    g.fillStyle='#d9dedb';g.fillRect(R.x0,R.y0,w,w);
    g.fillStyle='#bfd0d6';pg(sd.w.map(rel=>rel));g.fillStyle='#cfdac8';pg(sd.p);g.fillStyle='#c5d3bf';pg(sd.z);
  }
  g.save();g.strokeStyle='rgba(60,70,66,.20)';g.lineWidth=.7;g.setLineDash([5,5]);
  for(let s=0;s<D.nx*D.ny;s++){if(exp.has(s))continue;const R=rmSecRect(D,s);g.strokeRect(R.x0+.5,R.y0+.5,w-1,w-1)}
  g.restore();
  // survey edge: a darker dashed line where the opened map ends
  g.save();g.strokeStyle='rgba(40,50,46,.55)';g.lineWidth=1.6;g.setLineDash([9,6]);
  for(const s of exp){const c=s%D.nx,r=(s/D.nx)|0,R=rmSecRect(D,s);
    const open=(dc,dr)=>{const c2=c+dc,r2=r+dr;return c2>=0&&r2>=0&&c2<D.nx&&r2<D.ny&&!exp.has(r2*D.nx+c2)};
    g.beginPath();if(open(0,-1)){g.moveTo(R.x0,R.y0);g.lineTo(R.x1,R.y0)}if(open(0,1)){g.moveTo(R.x0,R.y1);g.lineTo(R.x1,R.y1)}if(open(-1,0)){g.moveTo(R.x0,R.y0);g.lineTo(R.x0,R.y1)}if(open(1,0)){g.moveTo(R.x1,R.y0);g.lineTo(R.x1,R.y1)}g.stroke()}
  g.restore();
}
/* a real footprint, extruded: facade walls with windows, flat roof */
function rmPolyBuilding(g,b,roofMat){
  const P=b.poly,n=P.length,H=Math.max(16,b.h*1.35),fs=facadeSet(b.h>34?'glassA':'office');
  let cx=0,cz=0;for(const p of P){cx+=p[0];cz+=p[1]}cx/=n;cz/=n;
  const pos=[],uv=[],idx=[];let run=0;
  for(let i=0;i<n;i++){
    const a=P[i],c=P[(i+1)%n],l=Math.hypot(c[0]-a[0],c[1]-a[1]);if(l<.5)continue;
    const nx=(c[1]-a[1])/l,nz=-(c[0]-a[0])/l,mx=(a[0]+c[0])/2-cx,mz=(a[1]+c[1])/2-cz,out=nx*mx+nz*mz>=0;   // outward normal of this wall (flip winding when needed)
    const k=pos.length/3,u1=Math.max(1,Math.round(l/11))/4,v1=H/(fs.floor*8);
    pos.push(a[0],0,a[1],c[0],0,c[1],c[0],H,c[1],a[0],H,a[1]);uv.push(0,0,u1,0,u1,v1,0,v1);
    if(out)idx.push(k,k+2,k+1,k,k+3,k+2);else idx.push(k,k+1,k+2,k,k+2,k+3);run+=l;
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,fs.side);m.castShadow=m.receiveShadow=true;g.add(m);
  const pts=P.map(p=>new THREE.Vector2(p[0],p[1])),tri=THREE.ShapeUtils.triangulateShape(pts,[]);
  if(tri.length){
    const rp=[],ri=[];pts.forEach(q=>rp.push(q.x,H,q.y));
    for(const t of tri){const a=pts[t[0]],c2=pts[t[1]],d=pts[t[2]],up=(c2.y-a.y)*(d.x-a.x)-(c2.x-a.x)*(d.y-a.y)>0;ri.push(t[0],up?t[1]:t[2],up?t[2]:t[1])}
    const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rp,3));rg.setIndex(ri);rg.computeVertexNormals();
    const r=new THREE.Mesh(rg,roofMat);r.castShadow=r.receiveShadow=true;g.add(r);
  }
}
/* the level: Bridgeport downtown on the real map. Registered after the Connecticut districts, so it gets the next free index and every old index stays valid */
const RM_NAME='Downtown (real map)';
function rmLevel(){
  const d={id:'br-real',town:'bridgeport',name:RM_NAME,ll:[41.1771,-73.1924],region:'maple',theme:'urban',approx:false,ff:null,chips:['Real streets','Grows with your routes','OpenStreetMap'],rows:[],cols:[],map:['.'],
    blurb:'Start on real streets in downtown Bridgeport: Lafayette Boulevard, State Street and Fairfield Avenue, I-95 curving past the river and the harbour. The map starts small and grows block by block as your routes reach its edge.',
    intro:'This is downtown Bridgeport on its real streets: Lafayette Boulevard, State Street and the diagonal of Fairfield Avenue, with the Pequonnock River, the harbour and I-95 on the edge of town. We only have a small piece of the map open. Run buses between the homes and the offices, and when your routes reach the edge of the map, the city grows outward along real streets.',
    outro:'Downtown is moving, and the map has grown with it. On to the rest of Bridgeport.'};
  const L=ctLevel(d,{id:'bridgeport',name:'Bridgeport'},0,0,1,0);
  L.real=true;L.osm=true;L.ctDist='br-real';L.cash=7200;
  Object.defineProperty(L,'lmNames',{configurable:true,enumerable:true,get(){if(!this._ln){const D=rmData(),ln={};for(const sd of D.sectors)for(const l of sd.l)if(l[3])ln[l[0]]=l[3];this._ln=ln}return this._ln},set(v){this._ln=v}});
  Object.defineProperty(L,'ff',{configurable:true,enumerable:true,get(){return this._ff||(this._ff=rmFFNew())},set(v){this._ff=v}});
  Object.defineProperty(L,'map',{configurable:true,enumerable:true,get(){return this._map||(this._map=rmDeriveMap(ffGraph(this.ff)))},set(v){this._map=v}});
  return{L,d};
}
/* a polygon edge that lies on a sector border (a cut made by the baker, not a shore) */
function rmBorder(gg,a,b){
  const w=gg.rm.D.sec*gg.sc,on=v=>{const q=(v-MARGIN)/w;return Math.abs(q-Math.round(q))*w<.6};
  return(Math.abs(a[0]-b[0])<.01&&on(a[0]))||(Math.abs(a[1]-b[1])<.01&&on(a[1]));
}
/* turn the pieces of one real building that were just added to the city group (n0 = child count before) about the building centre */
function rmRotate(g,b,n0){
  const rg=new THREE.Group();rg.position.set(b.x,0,b.y);rg.rotation.y=-b.ang;
  for(const c of g.children.slice(n0)){g.remove(c);c.position.x-=b.x;c.position.z-=b.y;rg.add(c)}
  g.add(rg);
}
