// Procedural infrastructure only. No logo assets, models or postprocessing.
export function createScene(T, canvas, mobile) {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: !mobile, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL2 unavailable');
  const renderer = new T.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: !mobile });
  renderer.setClearColor(0x080d14, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x080d14, .023);
  const camera = new T.PerspectiveCamera(42, 1, .1, 80);
  const target = new T.Vector3();
  const resources = new Set();
  const keep = value => { resources.add(value); return value; };
  const box = keep(new T.BoxGeometry(5.8, 1.45, .8));
  const edges = keep(new T.EdgesGeometry(box));
  const plane = keep(new T.PlaneGeometry(5.5, 1.2));
  const body = keep(new T.MeshStandardMaterial({ color: 0x102c40, metalness: .45, roughness: .5 }));
  scene.add(new T.HemisphereLight(0x99dcff, 0x080d14, mobile ? 2.5 : 2));
  const light = new T.DirectionalLight(0x52d9f0, 3);
  light.position.set(5, 8, 10); if (!mobile) scene.add(light);
  const names = ['GitHub', 'Jenkins', 'Docker', 'Kubernetes', 'AWS'];
  const roles = ['SOURCE', 'CI/CD', 'CONTAINER', 'ORCHESTRATION', 'CLOUD'];
  const statuses = ['CODE', 'BUILD', 'PACKAGE', 'DEPLOY', 'HEALTHY'];
  const nodes = names.map((name, i) => {
    const group = new T.Group();
    group.position.set(i % 2 ? .45 : -.45, 4.6 - i * 2.3, (i % 3) * -.45);
    group.rotation.y = i % 2 ? -.07 : .07;
    group.add(new T.Mesh(box, body));
    const border = keep(new T.LineBasicMaterial({ color: 0x52d9f0, transparent: true, opacity: .45 }));
    group.add(new T.LineSegments(edges, border));
    const label = document.createElement('canvas'); label.width = 768; label.height = 240;
    const ctx = label.getContext('2d');
    ctx.fillStyle = '#65d7ec'; ctx.font = '22px monospace'; ctx.fillText(roles[i], 36, 62);
    ctx.fillStyle = '#edf2f7'; ctx.font = 'bold 55px sans-serif'; ctx.fillText(name, 34, 142);
    ctx.fillStyle = '#8faabb'; ctx.font = '22px monospace'; ctx.fillText(`0${i + 1}`, 670, 66);
    ctx.fillStyle = '#52d9f0'; ctx.fillRect(36, 186, 190, 3);
    ctx.font = '20px monospace'; ctx.fillText(statuses[i], 540, 194);
    const texture = keep(new T.CanvasTexture(label)); texture.colorSpace = T.SRGBColorSpace;
    const material = keep(new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
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
  const count = mobile ? 70 : 180;
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
  const grid = new T.GridHelper(40, 24, 0x27637b, 0x153044);
  grid.position.set(0, -6.5, -6); scene.add(grid);
  keep(grid.geometry); keep(grid.material);
  // Soft glow sprite supplies atmosphere without bloom render passes.
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
  const glowCtx = glowCanvas.getContext('2d');
  const gradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, '#52d9f044'); gradient.addColorStop(1, '#52d9f000');
  glowCtx.fillStyle = gradient; glowCtx.fillRect(0, 0, 128, 128);
  const glowTexture = keep(new T.CanvasTexture(glowCanvas));
  const glow = new T.Sprite(keep(new T.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
  glow.position.set(0, 1, -5); glow.scale.set(19, 22, 1); scene.add(glow);
  return {
    resize(width, height, dpr) {
      renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
    },
    render(time, state) {
      camera.position.set(state.x + state.pointerX, state.y + state.pointerY, state.z);
      target.set(0, state.focusY, 0); camera.lookAt(target);
      nodes.forEach((node, i) => {
        const strength = Math.max(0, 1 - Math.abs(state.stage - i));
        node.border.opacity = .4 + strength * .55;
        node.group.scale.setScalar(1 + strength * .045);
        node.group.position.y = node.baseY + (state.motion ? Math.sin(time * .55 + i) * .045 : 0);
      });
      paths.forEach(({ curve, packets }, i) => packets.forEach((packet, j) => {
        curve.getPoint((time * .24 + j / packets.length + i * .15) % 1, packet.position);
      }));
      field.rotation.y = state.motion ? Math.sin(time * .03) * .035 : 0;
      renderer.render(scene, camera);
    },
    dispose() {
      resources.forEach(resource => resource.dispose()); resources.clear(); renderer.dispose();
    }
  };
}
