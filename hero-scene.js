// Procedural infrastructure: shared geometry, instanced hardware, no render passes.
export function createScene(T, canvas, mobile) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: !mobile, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL2 unavailable');
  const renderer = new T.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: !mobile });
  renderer.setClearColor(0x080d14, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x080f20, .035);
  const camera = new T.PerspectiveCamera(42, 1, .1, 80);
  const target = new T.Vector3();
  const resources = new Set();
  const keep = value => { resources.add(value); return value; };
  const box = keep(new T.BoxGeometry(5.8, 1.45, .8));
  const edges = keep(new T.EdgesGeometry(box));
  const plane = keep(new T.PlaneGeometry(5.5, 1.2));
  const body = keep(new T.MeshStandardMaterial({ color: 0x193a55, metalness: .4, roughness: .38 }));
  scene.add(new T.HemisphereLight(0x8ecaff, 0x060a18, 1.8));
  // Two lights on both device tiers; no shadow maps or postprocessing on mobile.
  const light = new T.DirectionalLight(0x62baff, 3.4);
  light.position.set(-5, 9, 7); scene.add(light);
  const names = ['GitHub', 'Jenkins', 'Docker', 'Kubernetes', 'AWS'];
  const roles = ['SOURCE', 'CI/CD', 'CONTAINER', 'ORCHESTRATION', 'CLOUD'];
  const statuses = ['CODE', 'BUILD', 'PACKAGE', 'DEPLOY', 'HEALTHY'];
  const nodes = names.map((name, i) => {
    const group = new T.Group();
    group.position.set(i % 2 ? .45 : -.45, 4.6 - i * 2.3, -i * 1.1);
    group.rotation.y = i % 2 ? -.07 : .07;
    group.add(new T.Mesh(box, body));
    const colors = [0xb4d5e8, 0xe5a268, 0x52c6f0, 0x7c9fff, 0xffb764];
    const border = keep(new T.LineBasicMaterial({ color: colors[i], transparent: true, opacity: .6, fog: false, toneMapped: false }));
    group.add(new T.LineSegments(edges, border));
    const accent = keep(new T.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: .25, metalness: .6, roughness: .35 }));
    // Hardware silhouettes share mounting rails, but differ by their role.
    if (i === 0) {
      const geometry = keep(new T.TorusGeometry(.23, .035, 6, 18));
      for (const x of [-1, 0, 1]) { const socket = new T.Mesh(geometry, accent); socket.position.set(x, .95, 0); group.add(socket); }
    } else if (i === 1) {
      const geometry = keep(new T.BoxGeometry(.5, .16, .65));
      for (let j = 0; j < 4; j++) { const blade = new T.Mesh(geometry, accent); blade.position.set(2.95, -.4 + j * .27, 0); group.add(blade); }
    } else if (i === 2) {
      const geometry = keep(new T.BoxGeometry(.6, .3, .6));
      for (let j = 0; j < 6; j++) { const container = new T.Mesh(geometry, accent); container.position.set(-.75 + (j % 3) * .75, .95 + Math.floor(j / 3) * .36, -.1); group.add(container); }
    } else if (i === 3) {
      const geometry = keep(new T.CylinderGeometry(.15, .15, .45, 6));
      for (let j = 0; j < 3; j++) { const cluster = new T.Mesh(geometry, accent); cluster.rotation.x = Math.PI / 2; cluster.position.set(3.1, -.4 + j * .4, 0); group.add(cluster); }
    } else {
      const geometry = keep(new T.SphereGeometry(.3, mobile ? 8 : 12, 6));
      for (let j = 0; j < 3; j++) { const cloud = new T.Mesh(geometry, accent); cloud.scale.set(1, .65, .7); cloud.position.set((j - 1) * .4, .95, 0); group.add(cloud); }
    }
    const label = document.createElement('canvas'); label.width = 768; label.height = 240;
    const ctx = label.getContext('2d');
    ctx.fillStyle = `#${colors[i].toString(16).padStart(6, '0')}`; ctx.font = '22px monospace'; ctx.fillText(roles[i], 36, 62);
    ctx.fillStyle = '#edf2f7'; ctx.font = 'bold 72px sans-serif'; ctx.fillText(name, 34, 145);
    ctx.fillStyle = '#8faabb'; ctx.font = '22px monospace'; ctx.fillText(`0${i + 1}`, 670, 66);
    ctx.fillStyle = '#52d9f0'; ctx.fillRect(36, 186, 190, 3);
    ctx.font = '20px monospace'; ctx.fillText(statuses[i], 540, 194);
    const texture = keep(new T.CanvasTexture(label)); texture.colorSpace = T.SRGBColorSpace;
    // UI lettering stays readable independently of the cinematic fog/exposure.
    const material = keep(new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    const face = new T.Mesh(plane, material); face.position.z = .41; group.add(face);
    scene.add(group);
    return { group, border, baseY: group.position.y };
  });
  const lineMaterial = keep(new T.LineBasicMaterial({ color: 0x429abd, transparent: true, opacity: .5 }));
  const paths = [];
  const packetGeometry = keep(new T.SphereGeometry(.055, 6, 4));
  const packetMaterial = keep(new T.MeshBasicMaterial({ color: 0x9bf0ff }));
  nodes.slice(0, -1).forEach((node, i) => {
    const a = node.group.position.clone(); a.y -= .75;
    const b = nodes[i + 1].group.position.clone(); b.y += .75;
    const midA = a.clone(); midA.x += .8; midA.y -= .35;
    const midB = b.clone(); midB.x += .8; midB.y += .35;
    const curve = new T.CubicBezierCurve3(a, midA, midB, b);
    scene.add(new T.Line(keep(new T.BufferGeometry().setFromPoints(curve.getPoints(24))), lineMaterial));
    const packets = Array.from({ length: mobile ? 1 : 3 }, () => {
      const packet = new T.Mesh(packetGeometry, packetMaterial); scene.add(packet); return packet;
    });
    paths.push({ curve, packets });
  });
  // One draw call for the entire distant particle field.
  const count = mobile ? 36 : 90;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = Math.sin(i * 73.17) * 11;
    positions[i * 3 + 1] = Math.cos(i * 19.71) * 10;
    positions[i * 3 + 2] = -3 - (i % 17) * .7;
  }
  const fieldGeometry = keep(new T.BufferGeometry());
  fieldGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const field = new T.Points(fieldGeometry, keep(new T.PointsMaterial({ color: 0x62b9d6, size: .035, transparent: true, opacity: .55, depthWrite: false })));
  scene.add(field);
  const network = [];
  for (let i = 0; i < count - 1; i += 5) {
    for (const j of [i, i + 1]) network.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
  }
  const networkGeometry = keep(new T.BufferGeometry());
  networkGeometry.setAttribute('position', new T.Float32BufferAttribute(network, 3));
  scene.add(new T.LineSegments(networkGeometry, keep(new T.LineBasicMaterial({ color: 0x307897, transparent: true, opacity: .14 }))));
  const grid = new T.GridHelper(44, 32, 0x27637b, 0x153044);
  grid.position.set(0, -7.18, -12); scene.add(grid);
  keep(grid.geometry); keep(grid.material);
  // A real corridor surrounds the pipeline: racks, gantries and conduits extend
  // 28 world units behind its mounting rails. Perspective reveals their sides.
  const unitBox = keep(new T.BoxGeometry(1, 1, 1));
  const structure = keep(new T.MeshStandardMaterial({ color: 0x244966, metalness: .4, roughness: .42 }));
  const darkMetal = keep(new T.MeshStandardMaterial({ color: 0x0c1b2c, metalness: .35, roughness: .6 }));
  const blue = keep(new T.MeshBasicMaterial({ color: 0x398cff, toneMapped: false }));
  const cyan = keep(new T.MeshBasicMaterial({ color: 0x83dcff, toneMapped: false }));
  const amber = keep(new T.MeshBasicMaterial({ color: 0xffae62, toneMapped: false }));
  const hardware = [], chassis = [], blades = [], blueStrips = [], indicators = [], warmStrips = [];
  const part = (list, x, y, z, sx, sy, sz) => list.push([x, y, z, sx, sy, sz]);
  function batch(parts, material) {
    const mesh = keep(new T.InstancedMesh(unitBox, material, parts.length));
    const transform = new T.Object3D();
    parts.forEach(([x, y, z, sx, sy, sz], i) => {
      transform.position.set(x, y, z); transform.scale.set(sx, sy, sz);
      transform.updateMatrix(); mesh.setMatrixAt(i, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere(); scene.add(mesh);
  }
  const bays = mobile ? 3 : 5;
  for (let bay = 0; bay < bays; bay++) {
    const z = -4 - bay * 5.2;
    // Portal frames and illuminated ceiling trays define the vanishing point.
    for (const side of [-1, 1]) {
      part(hardware, side * 4.35, 0, z - 1.4, .16, 14.4, .24);
      part(blueStrips, side * 4.24, 0, z - 1.23, .035, 14.1, .035);
      part(hardware, side * 3.15, 7, z - 2, .25, .22, 5.2);
      part(blueStrips, side * 3.15, 6.85, z - 2, .09, .035, 4.8);
      // Rack doors are recessed inside a thick frame, with individual blades.
      const x = side * 5.45;
      part(chassis, x, -.2, z, 2.1, 13.2, 2.7);
      for (const edge of [-1, 1]) {
        part(hardware, x + edge * .94, -.2, z + 1.42, .13, 13.2, .18);
        part(hardware, x, -.2 + edge * 6.55, z + 1.42, 2.1, .14, .18);
      }
      part(blueStrips, x - side * .94, -.2, z + 1.53, .035, 12.9, .035);
      for (let slot = 0; slot < 14; slot++) {
        const y = -6.1 + slot * .9;
        part(blades, x, y, z + 1.4, 1.75, .69, .16);
        // Air intakes are actual recessed bars, rather than a flat rack image.
        for (let vent = 0; vent < (mobile ? 2 : 4); vent++) {
          part(chassis, x - .36 + vent * .2, y, z + 1.495, .07, .4, .025);
        }
        part(indicators, x + .67, y + .12, z + 1.51, .11, .045, .025);
        part(slot % 4 === 0 ? warmStrips : blueStrips, x + .67, y - .07, z + 1.51, .11, .035, .025);
      }
      // Cable routes along the floor remain behind the foreground pipeline.
      part(hardware, side * 3.75, -7.1, z - 1.6, .55, .12, 5.2);
      part(blueStrips, side * 3.54, -7.02, z - 1.6, .04, .025, 5.05);
      part(warmStrips, side * 3.95, -7.02, z - 1.6, .025, .025, 5.05);
    }
    part(hardware, 0, 7.15, z - 1.4, 8.85, .2, .3);
    part(hardware, 0, -7, z - 1.4, 8.85, .2, .3);
  }
  // The delivery modules keep their existing geometry, labels and depth order.
  for (const x of [-3.4, 3.4]) {
    part(hardware, x, -.1, -3, .09, 12.8, .2);
    part(blueStrips, x, -.1, -2.88, .025, 12.8, .025);
  }
  // A lit rear bulkhead anchors the perspective even on narrow displays.
  part(chassis, 0, 0, -29, 15, 14.4, .5);
  part(hardware, 0, 0, -28.65, 3.8, 11.8, .2);
  for (const x of [-1.85, 1.85]) part(blueStrips, x, 0, -28.5, .08, 11.8, .04);
  part(blueStrips, 0, 5.85, -28.5, 3.7, .08, .04);
  part(warmStrips, 0, -5.85, -28.5, 3.7, .08, .04);
  batch(hardware, structure); batch(chassis, darkMetal); batch(blades, body);
  batch(blueStrips, blue); batch(indicators, cyan); batch(warmStrips, amber);
  const floor = new T.Mesh(keep(new T.PlaneGeometry(24, 38)), keep(new T.MeshStandardMaterial({
    color: 0x0b1b30, metalness: .65, roughness: .32, emissive: 0x071528, emissiveIntensity: .4
  })));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -7.2, -11); scene.add(floor);
  const warm = new T.PointLight(0xffae62, mobile ? 28 : 42, 28, 2);
  warm.position.set(4, -3, 4); scene.add(warm);
  // Soft glow sprite supplies atmosphere without bloom render passes.
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
  const glowCtx = glowCanvas.getContext('2d');
  const gradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#52d9f044'); gradient.addColorStop(1, '#52d9f000');
  glowCtx.fillStyle = gradient; glowCtx.fillRect(0, 0, 128, 128);
  const glowTexture = keep(new T.CanvasTexture(glowCanvas));
  const glow = new T.Sprite(keep(new T.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
  glow.position.set(-2, 4, -10); glow.scale.set(14, 18, 1); scene.add(glow);
  return {
    resize(width, height, dpr) {
      renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
    },
    render(time, state) {
      // Center all five modules in the resting overview. Blend back into the
      // existing stage camera as its first tween begins; no new scroll triggers.
      const overview = Math.max(0, Math.min(1, -state.stage));
      camera.position.set(state.x + state.pointerX, state.y - overview * 2.2 + state.pointerY, state.z);
      target.set(0, state.focusY - overview * 2.7, 0); camera.lookAt(target);
      nodes.forEach((node, i) => {
        const strength = Math.max(0, 1 - Math.abs(state.stage - i));
        node.border.opacity = .6 + strength * .35;
        node.group.scale.setScalar(1 + strength * .045);
        node.group.position.y = node.baseY;
      });
      paths.forEach(({ curve, packets }, i) => packets.forEach((packet, j) => {
        curve.getPoint((state.progress * 3 + j / packets.length + i * .15) % 1, packet.position);
      }));
      field.rotation.y = state.motion ? state.progress * .035 : 0;
      renderer.render(scene, camera);
    },
    dispose() {
      resources.forEach(resource => resource.dispose()); resources.clear(); renderer.dispose();
    }
  };
}
