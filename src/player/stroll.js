// Automatic scenic stroll: follows a designed loop of sidewalks and crosswalks, waits for the
// walk signal and clear roads, pauses at viewpoints and glances around gently.
export class Stroll {
  constructor(player) {
    this.player = player;
    this.route = [];
    this.active = false;
    this.userYaw = 0; this.userPitch = 0;
  }
  setCity(cb, crowd, traffic) {
    this.cb = cb; this.crowd = crowd; this.traffic = traffic;
    const G = cb.graph;
    const hint = cb.routeHint || autoHint(cb);
    const ids = hint.map(([x, z]) => G.nearestNode(x, z, (n) => n.edges.length > 0)?.id).filter((v) => v !== undefined);
    const route = [];
    for (let i = 0; i < ids.length; i++) {
      const a = ids[i], b = ids[(i + 1) % ids.length];
      const p = G.path(a, b);
      if (!p) continue;
      if (route.length) p.shift();
      route.push(...p);
    }
    if (route.length > 1 && route[route.length - 1] === route[0]) route.pop();
    this.route = route;
    // precompute cumulative lengths
    this.pts = route.map((id) => G.nodes[id]);
    this.cum = [0];
    for (let i = 0; i < this.pts.length; i++) {
      const a = this.pts[i], b = this.pts[(i + 1) % this.pts.length];
      this.cum.push(this.cum[i] + Math.hypot(b.x - a.x, b.z - a.z));
    }
    this.total = this.cum[this.cum.length - 1] || 1;
    this.viewpoints = (cb.viewpoints || []).map((v) => ({ ...v, s: this.nearestS(v.x, v.z) }));
  }
  nearestS(x, z) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < this.pts.length; i++) {
      const a = this.pts[i], b = this.pts[(i + 1) % this.pts.length];
      const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (L * L)));
      const px = a.x + dx * t, pz = a.z + dz * t;
      const d = (px - x) ** 2 + (pz - z) ** 2;
      if (d < bd) { bd = d; best = this.cum[i] + t * L; }
    }
    return best;
  }
  at(s) {
    s = ((s % this.total) + this.total) % this.total;
    let i = 0;
    while (i < this.pts.length - 1 && this.cum[i + 1] < s) i++;
    const a = this.pts[i], b = this.pts[(i + 1) % this.pts.length];
    const L = this.cum[i + 1] - this.cum[i] || 1;
    const t = (s - this.cum[i]) / L;
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, i, t, a, b };
  }
  segEdge(i) {
    const a = this.route[i], b = this.route[(i + 1) % this.route.length];
    return this.cb.graph.edgeBetween(a, b);
  }
  start() {
    if (!this.pts.length) return false;
    const p = this.player;
    if (p.seat) p.stand();
    this.s = this.nearestS(p.x, p.z);
    this.active = true;
    this.speed = 0; this.wait = 0; this.pause = 0; this.lookOff = 0; this.lookPitch = 0; this.lookTimer = 4;
    this.heading = p.yaw; this.userYaw = 0; this.userPitch = 0;
    this.visited = new Set();
    this.nextBrowse = 40 + Math.random() * 40;
    this.status = 'Strolling';
    return true;
  }
  stop() {
    this.active = false;
    const p = this.player;
    // fold any look offsets into the free-walk camera so nothing jumps
    p.yaw = p.yaw + p.lookYawOff; p.pitch = p.pitch + p.lookPitchOff;
    p.lookYawOff = 0; p.lookPitchOff = 0;
  }
  update(dt, settings, ctx) {
    const p = this.player;
    const reduced = settings.reducedMotion;
    // manual look while strolling: accumulate an offset that relaxes back after a while
    const l = p.controls.consumeLook();
    const sens = settings.lookSensitivity;
    if (l.dx || l.dy) { this.userYaw -= l.dx * 0.0032 * sens; this.userPitch -= l.dy * 0.0028 * sens * (settings.invertY ? -1 : 1); this.userT = 3.5; }
    this.userYaw += p.controls.readTurn() * dt * 1.5;
    if (p.controls.readTurn()) this.userT = 3.5;
    this.userT = (this.userT || 0) - dt;
    if (this.userT <= 0) { this.userYaw *= 1 - Math.min(1, dt * 0.6); this.userPitch *= 1 - Math.min(1, dt * 0.6); }
    this.userPitch = Math.max(-1.1, Math.min(1.1, this.userPitch));

    const target = 1.12 * settings.walkSpeed;
    let want = target;
    this.status = 'Strolling';
    const cur = this.at(this.s);
    // pause points
    if (this.pause > 0) {
      this.pause -= dt; want = 0; this.status = this.pauseLabel || 'Pausing';
    } else {
      for (const v of this.viewpoints) {
        const d = ((v.s - this.s) % this.total + this.total) % this.total;
        if (d < 0.5 && !this.visited.has(v)) {
          this.visited.add(v); this.pause = reduced ? 6 : 8; this.pauseLook = v.look; this.pauseLabel = v.label;
          setTimeout(() => this.visited.delete(v), 60000);
        }
      }
      this.nextBrowse -= dt;
      const e = this.segEdge(cur.i);
      if (this.nextBrowse <= 0 && e && e.browse && cur.t > 0.3 && cur.t < 0.7) {
        this.pause = 5; this.pauseLook = null; this.pauseBrowse = e.browse; this.pauseLabel = 'Window shopping';
        this.nextBrowse = 50 + Math.random() * 60;
      }
    }
    // crossings: look ahead for a crosswalk segment and wait at the curb for the signal and a clear road
    const ahead = this.at(this.s + 0.6);
    const eNext = this.segEdge(ahead.i);
    const eCur = this.segEdge(cur.i);
    if (eNext && eNext.kind === 'cross' && eCur !== eNext) {
      const A = ahead.a, B = ahead.b;
      const ok = this.cb.signals.canWalk(eNext.axis, eNext.len / 1.1 + 2);
      const x0 = Math.min(A.x, B.x) - 1.5, x1 = Math.max(A.x, B.x) + 1.5, z0 = Math.min(A.z, B.z) - 1.5, z1 = Math.max(A.z, B.z) + 1.5;
      const busy = this.traffic && this.traffic.occupied(x0, z0, x1, z1, 3);
      if (!ok || busy) { want = 0; this.status = ok ? 'Waiting for traffic' : 'Waiting to cross'; this.waitLook = eNext; }
      else this.waitLook = null;
    } else this.waitLook = null;
    // people in the way
    const dirx = ahead.x - cur.x, dirz = ahead.z - cur.z, dl = Math.hypot(dirx, dirz) || 1;
    if (this.crowd && this.crowd.blockedAhead(p.x, p.z, dirx / dl, dirz / dl, 1.5)) { want = Math.min(want, 0.25); this.status = 'Making way'; }
    this.speed += (want - this.speed) * Math.min(1, dt * (want < this.speed ? 3 : 1.2));
    // move a "carrot" along the route; the walker eases toward it (rounds corners naturally)
    const carrot = this.at(this.s + 1.4);
    const dx = carrot.x - p.x, dz = carrot.z - p.z, d = Math.hypot(dx, dz);
    if (d < 2.4) this.s += this.speed * dt;
    if (this.s > this.total) this.s -= this.total;
    if (d > 0.05 && this.speed > 0.02) {
      const step = Math.min(d, this.speed * dt * (d > 1.6 ? 1.15 : 1));
      p.moveTo(p.x + dx / d * step, p.z + dz / d * step);
    } else p.moveTo(p.x, p.z);
    if (d > 6) { // drifted (e.g. after a collision) — gently re-sync
      this.s = this.nearestS(p.x, p.z);
    }
    // heading & look-around
    if (d > 0.3) {
      const hd = Math.atan2(-dx, -dz);
      this.heading = lerpAngle(this.heading, hd, Math.min(1, dt * (reduced ? 0.9 : 1.6)));
    }
    let lookYaw = 0, lookPitch = 0;
    if (this.pause > 0 && this.pauseLook) {
      const [lx, ly, lz] = this.pauseLook;
      const want2 = Math.atan2(-(lx - p.x), -(lz - p.z));
      lookYaw = angDiff(want2, this.heading);
      lookPitch = Math.atan2(ly - 1.7, Math.hypot(lx - p.x, lz - p.z)) * 0.6;
    } else if (this.pause > 0 && this.pauseBrowse) {
      const want2 = Math.atan2(-this.pauseBrowse.nx, -this.pauseBrowse.nz);
      lookYaw = angDiff(want2, this.heading); lookPitch = -0.02;
    } else if (this.waitLook && !reduced) {
      lookYaw = Math.sin(performance.now() / 1400) * 0.5; // check both ways
    } else if (!reduced) {
      this.lookTimer -= dt;
      if (this.lookTimer <= 0) {
        this.lookTimer = 6 + Math.random() * 8;
        const r = Math.random();
        const e = this.segEdge(cur.i);
        if (r < 0.4 || !e || !e.browse) { this.lookOff = 0; this.lookPitch = 0; }
        else if (r < 0.75) {
          const want2 = Math.atan2(-e.browse.nx, -e.browse.nz);
          this.lookOff = Math.max(-0.75, Math.min(0.75, angDiff(want2, this.heading) * 0.55)); this.lookPitch = 0.05;
        } else { this.lookOff = (Math.random() - 0.5) * 0.5; this.lookPitch = 0.16; }
      }
      lookYaw = this.lookOff; lookPitch = this.lookPitch;
    }
    this.curLook = lerpAngle(this.curLook ?? 0, lookYaw, Math.min(1, dt * (reduced ? 0.4 : 0.7)));
    this.curPitch = (this.curPitch ?? 0) + (lookPitch - (this.curPitch ?? 0)) * Math.min(1, dt * 0.6);
    p.yaw = this.heading;
    p.pitch = -0.02 + this.curPitch;
    p.lookYawOff = this.curLook + this.userYaw;
    p.lookPitchOff = this.userPitch;
    const moved = this.speed;
    p.speed = moved;
    p.applyCamera(dt, settings, moved);
  }
}

function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
function lerpAngle(a, b, t) { return a + angDiff(b, a) * t; }

function autoHint(cb) {
  // A rectangle around the first inside block.
  const b = cb.blocks?.find((x) => x.inside);
  if (!b) return [[cb.spawn.x, cb.spawn.z]];
  return [[b.cx0 - 2, b.cz0 - 2], [b.cx1 + 2, b.cz0 - 2], [b.cx1 + 2, b.cz1 + 2], [b.cx0 - 2, b.cz1 + 2]];
}
