// Photo mode: pauses the stroll/walk, gives a free-flying camera with lens, exposure, depth of
// field and grain controls, and saves a PNG of the current frame.
export class PhotoMode {
  constructor(engine, controls, settings) {
    this.engine = engine; this.controls = controls; this.settings = settings;
    this.active = false;
    this.pos = { x: 0, y: 0, z: 0 }; this.yaw = 0; this.pitch = 0;
  }
  enter(player) {
    if (this.active) return;
    this.active = true;
    const c = this.engine.camera;
    this.saved = { fov: c.fov, x: player.x, z: player.z, yaw: player.yaw, pitch: player.pitch, yo: player.lookYawOff, po: player.lookPitchOff };
    this.pos = { x: c.position.x, y: c.position.y, z: c.position.z };
    this.yaw = c.rotation.y; this.pitch = c.rotation.x;
  }
  exit(player) {
    if (!this.active) return;
    this.active = false;
    const c = this.engine.camera;
    c.fov = this.saved.fov; c.updateProjectionMatrix();
    player.yaw = this.saved.yaw; player.pitch = this.saved.pitch;
    player.lookYawOff = this.saved.yo; player.lookPitchOff = this.saved.po;
    this.engine.bokeh.enabled = false;
  }
  update(dt) {
    const P = this.settings.photo;
    const c = this.engine.camera;
    const ctl = this.controls;
    const l = ctl.consumeLook();
    const zoomDamp = P.fov / 60;
    this.yaw -= l.dx * 0.0028 * zoomDamp; this.pitch -= l.dy * 0.0025 * zoomDamp;
    this.yaw += ctl.readTurn() * dt * 1.2 * zoomDamp;
    this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
    const m = ctl.readMove();
    const sp = (m.run ? 6 : 2.2) * dt;
    const fx = -Math.sin(this.yaw) * Math.cos(this.pitch), fy = Math.sin(this.pitch), fz = -Math.cos(this.yaw) * Math.cos(this.pitch);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    this.pos.x += (fx * m.z + rx * m.x) * sp;
    this.pos.y += fy * m.z * sp;
    this.pos.z += (fz * m.z + rz * m.x) * sp;
    if (ctl.keys.has('q') || ctl.keys.has('PageDown')) this.pos.y -= sp;
    if (ctl.keys.has('e') || ctl.keys.has('PageUp')) this.pos.y += sp;
    if (ctl.uiUp) this.pos.y += ctl.uiUp * sp;
    this.pos.y = Math.max(0.25, Math.min(60, this.pos.y));
    // keep within a sensible distance of where photo mode started
    const dx = this.pos.x - this.saved.x, dz = this.pos.z - this.saved.z, d = Math.hypot(dx, dz);
    if (d > 60) { this.pos.x = this.saved.x + dx / d * 60; this.pos.z = this.saved.z + dz / d * 60; }
    const w = ctl.consumeWheel();
    if (w) this.settings.setPhoto('fov', Math.max(15, Math.min(100, P.fov + w * 3)));
    c.position.set(this.pos.x, this.pos.y, this.pos.z);
    c.rotation.set(this.pitch, this.yaw, P.roll * Math.PI / 180, 'YXZ');
    if (Math.abs(c.fov - P.fov) > 0.01) { c.fov = P.fov; c.updateProjectionMatrix(); }
    const b = this.engine.bokeh;
    b.enabled = !!P.dof;
    if (P.dof) {
      b.uniforms.focus.value = P.focus;
      b.uniforms.aperture.value = P.aperture * 0.00012;
      b.uniforms.maxblur.value = 0.012;
    }
  }
  /** Render one frame and download it as a PNG. */
  capture(renderFn, cityName) {
    renderFn();
    const canvas = this.engine.renderer.domElement;
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('The browser could not create the image.')); return; }
          const a = document.createElement('a');
          const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          a.download = `rainfall-avenue-${cityName}-${stamp}.png`;
          a.href = URL.createObjectURL(blob);
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          resolve(a.download);
        }, 'image/png');
      } catch (e) { reject(e); }
    });
  }
}
