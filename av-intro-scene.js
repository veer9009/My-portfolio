// Procedural studio: no downloaded textures, fonts, models or postprocessing.
export function createIntroScene(T, renderer) {
  const resources = new Set();
  const keep = value => { resources.add(value); return value; };
  const dispose = () => { for (const value of resources) value.dispose(); resources.clear(); };
  try {
    const mobile = innerWidth < 700;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(38, 1, .1, 60);
    const clamp = value => Math.min(1, Math.max(0, value));
    const ease = window.gsap?.parseEase('power2.inOut') || (x => x * x * (3 - 2 * x));
    const sweep = { value: -4 };
    const reveal = { value: 0 };

    // Bake area-like studio panels into a tiny PMREM for real metal reflections.
    const studio = new T.Scene();
    studio.background = new T.Color(0x10151c);
    const panelGeometry = keep(new T.PlaneGeometry(1, 1));
    for (const [color, power, x, y, z, w, h] of [
      [0xe8f0ff, 5, -4, 4, 6, 2, 7], [0x498dff, 4, 5, 1, 2, 2, 7],
      [0xffb952, 6, -5, -1, 3, 3, 5], [0xffffff, 5, 0, 6, 0, 8, 2],
      [0x719fff, 3, 0, 1, -5, 7, 2], [0xe0e7ee, 3, 0, 2, 8, 7, 3],
      [0xffffff, 3, -2, -.5, 7, 3, 1], [0xffab35, 5, 4, -2, 6, 4, 2]
    ]) {
      const panel = new T.Mesh(panelGeometry, keep(new T.MeshBasicMaterial({
        color: new T.Color(color).multiplyScalar(power), side: T.DoubleSide
      })));
      panel.position.set(x, y, z); panel.scale.set(w, h, 1); panel.lookAt(0, 0, 0);
      studio.add(panel);
    }
    const pmrem = new T.PMREMGenerator(renderer);
    try { scene.environment = keep(pmrem.fromScene(studio, .06, .1, 40)).texture; }
    finally { pmrem.dispose(); }

    // Subpixel horizontal striations give the silver a restrained brushed finish.
    const brush = document.createElement('canvas');
    brush.width = 256; brush.height = 128;
    const ctx = brush.getContext('2d');
    ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 256, 128);
    for (let y = 0; y < 128; y++) {
      const gray = 115 + ((y * 73) % 29);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`; ctx.fillRect(0, y, 256, 1);
    }
    const brushed = keep(new T.CanvasTexture(brush));
    brushed.wrapS = brushed.wrapT = T.RepeatWrapping; brushed.repeat.set(1, 3);
    const metal = keep(new T.MeshPhysicalMaterial({ color: 0xbac0c7, metalness: 1,
      roughness: .29, bumpMap: brushed, bumpScale: .022, clearcoat: .4, envMapIntensity: 1.25 }));
    const graphite = keep(new T.MeshStandardMaterial({ color: 0x38414c, metalness: 1, roughness: .24 }));
    const gold = keep(new T.MeshStandardMaterial({ color: 0xffc05a, metalness: .75,
      roughness: .2, emissive: 0xff980a, emissiveIntensity: 1.8 }));

    // The light sweep reveals actual extruded surfaces, not a flat image overlay.
    function illuminate(material, reflection = false) {
      material.onBeforeCompile = shader => {
        shader.uniforms.uSweep = sweep;
        shader.uniforms.uReveal = reveal;
        shader.vertexShader = 'varying vec3 vIntroPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\nvIntroPosition = position;');
        shader.fragmentShader = 'uniform float uSweep; uniform float uReveal; varying vec3 vIntroPosition;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `
          #include <dithering_fragment>
          float lit = 1.0 - smoothstep(uSweep - .25, uSweep + .08, vIntroPosition.x);
          float band = exp(-pow((vIntroPosition.x - uSweep) * 9.0, 2.0));
          gl_FragColor.rgb *= lit * uReveal;
          ${material.bumpMap ? 'float grainPhase = vIntroPosition.y * 420.0; float brushGrain = sin(grainPhase) * (1.0 - smoothstep(1.0, 3.0, fwidth(grainPhase))); gl_FragColor.rgb *= .99 + .01 * brushGrain;' : ''}
          gl_FragColor.rgb += vec3(1.0, .72, .28) * band * uReveal * .75;
          ${reflection ? 'gl_FragColor.rgb *= .38 * pow(clamp((1.2 - vIntroPosition.y) / 2.4, 0.0, 1.0), 1.6);' : ''}
        `);
      };
      material.customProgramCacheKey = () => reflection ? 'av-reflection' : 'av-sweep';
      return material;
    }
    [metal, graphite, gold].forEach(material => illuminate(material));
    const reflectedMetal = illuminate(keep(metal.clone()), true);
    const reflectedSide = illuminate(keep(graphite.clone()), true);
    const reflectedGold = illuminate(keep(gold.clone()), true);
    const logo = new T.Group();
    logo.rotation.set(.035, -.16, 0); logo.position.set(.17, .25, 0);
    scene.add(logo);
    const reflection = new T.Group();
    reflection.position.set(.17, -2.25, 0); reflection.scale.y = -1;
    reflection.rotation.set(-.035, -.16, 0); scene.add(reflection);
    function shape(points, hole) {
      const result = new T.Shape(points.map(([x, y]) => new T.Vector2(x, y)));
      result.closePath();
      if (hole) { const path = new T.Path(hole.map(([x, y]) => new T.Vector2(x, y))); path.closePath(); result.holes.push(path); }
      return result;
    }
    const letters = [
      shape([[-2.65,-1.15],[-1.79,1.15],[-1.25,1.15],[-.39,-1.15],[-.97,-1.15],[-1.16,-.6],[-1.89,-.6],[-2.08,-1.15]],
        [[-1.76,-.14],[-1.3,-.14],[-1.53,.57]]),
      shape([[-.22,1.15],[.39,1.15],[1.04,-.55],[1.7,1.15],[2.31,1.15],[1.34,-1.15],[.75,-1.15]])
    ];
    for (const letter of letters) {
      const geometry = keep(new T.ExtrudeGeometry(letter, { depth: .72, steps: 1,
        bevelEnabled: true, bevelSegments: mobile ? 3 : 5, bevelSize: .095, bevelThickness: .12, curveSegments: 1 }));
      geometry.translate(0, 0, -.36);
      logo.add(new T.Mesh(geometry, [metal, graphite]));
      reflection.add(new T.Mesh(geometry, [reflectedMetal, reflectedSide]));
      // A substantial illuminated rear seam plus precise gold inlays on the front.
      const seam = new T.Mesh(geometry, gold);
      seam.scale.set(1.045, 1.045, .2); seam.position.z = -.32; logo.add(seam);
      for (const outline of [letter, ...letter.holes]) {
        const points = outline.getPoints(1);
        const contour = new T.CurvePath();
        for (let i = 0; i < points.length - 1; i++) {
          contour.add(new T.LineCurve3(new T.Vector3(points[i].x, points[i].y, .485),
            new T.Vector3(points[i + 1].x, points[i + 1].y, .485)));
        }
        const trim = keep(new T.TubeGeometry(contour, points.length * 6, .027, mobile ? 4 : 6, true));
        logo.add(new T.Mesh(trim, gold)); reflection.add(new T.Mesh(trim, reflectedGold));
      }
    }
    scene.add(new T.HemisphereLight(0xd8e8ff, 0x080b11, .5));
    for (const [color, power, x, y, z] of [[0xeaf2ff, 3, -3, 5, 5], [0x327dff, 3, 4, 1, -1], [0xffab42, 5, -4, 0, 2]]) {
      const light = new T.DirectionalLight(color, power); light.position.set(x, y, z); scene.add(light);
    }

    const soft = document.createElement('canvas'); soft.width = soft.height = 128;
    const context = soft.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, '#fff'); gradient.addColorStop(.22, '#ffffff80'); gradient.addColorStop(1, '#ffffff00');
    context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
    const glowMap = keep(new T.CanvasTexture(soft));
    const atmosphere = [];
    function glow(color, x, y, z, width, height, opacity) {
      const material = keep(new T.SpriteMaterial({ map: glowMap, color, transparent: true,
        opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
      const sprite = new T.Sprite(material); sprite.position.set(x, y, z); sprite.scale.set(width, height, 1);
      scene.add(sprite); atmosphere.push({ sprite, opacity, x }); return sprite;
    }
    glow(0x24538a, 1.6, .5, -3, 8, 5, .2);
    glow(0xffa534, -1.8, .2, -2, 7, 5, .23);
    glow(0xffb843, 0, -1.05, .1, 8, .2, .5); // Amber floor bounce.
    glow(0xffb23a, -1, -1.5, 1, 6, .9, .2);
    if (!mobile) {
      glow(0x94aec7, 2, -.95, -1, 7, .8, .09);
      glow(0xe0b475, -2, -.7, 1, 6, .5, .085);
    }
    const fogTime = { value: 0 }, fogOpacity = { value: 0 };
    if (!mobile) {
      // One inexpensive noise veil adds slow, irregular wisps behind the metal.
      const fogMaterial = keep(new T.ShaderMaterial({
        uniforms: { uTime: fogTime, uOpacity: fogOpacity },
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: `varying vec2 vUv; uniform float uTime, uOpacity;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
          void main(){vec2 p=vUv*vec2(7.0,4.0)+vec2(uTime*.09,0.0);
            float n=noise(p)+.5*noise(p*2.1-vec2(uTime*.12,0));
            float veil=smoothstep(.5,1.25,n)*exp(-pow((vUv.y-.35)*4.0,2.0));
            veil*=smoothstep(0.0,.18,vUv.x)*smoothstep(0.0,.18,1.0-vUv.x);
            gl_FragColor=vec4(.7,.48,.26,veil*uOpacity);}`,
        transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
      }));
      const fog = new T.Mesh(keep(new T.PlaneGeometry(12, 5)), fogMaterial);
      fog.position.set(0, -.2, -1.1); scene.add(fog);
    }

    // Real geometry behind the AV: segmented rings visibly rotate and pulse.
    const rings = new T.Group(); rings.position.set(0, .45, -1.7); scene.add(rings);
    const ringMaterials = [];
    function ringMaterial(strength) {
      const material = keep(new T.MeshBasicMaterial({ color: 0xffae28, transparent: true,
        opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
      ringMaterials.push({ material, strength }); return material;
    }
    const ringCore = ringMaterial(1), ringHalo = ringMaterial(.18), ringAccent = ringMaterial(.9);
    ringCore.color.set(0xffd887);
    const ringSegments = mobile ? 80 : 144;
    for (const [radius, tilt] of [[2.28, -.18], [2.63, .25]]) {
      const ring = new T.Group(); ring.rotation.y = tilt; ring.rotation.x = .12; rings.add(ring);
      ring.add(new T.Mesh(keep(new T.TorusGeometry(radius, .024, 6, ringSegments)), ringCore));
      ring.add(new T.Mesh(keep(new T.TorusGeometry(radius, .085, 6, ringSegments)), ringHalo));
      const arcGeometry = keep(new T.TorusGeometry(radius + .105, .038, 6, ringSegments / 2, Math.PI * .48));
      for (let i = 0; i < 3; i++) {
        const arc = new T.Mesh(arcGeometry, ringAccent); arc.rotation.z = i * Math.PI * 2 / 3; ring.add(arc);
      }
    }
    glow(0xff9b19, 0, .6, -2, 7, 7, .18);

    // A broad ribbon with a moving bright head. Its 3D path crosses both sides
    // of the logo, so normal depth testing naturally hides the rear sections.
    class RibbonCurve extends T.Curve {
      getPoint(t, target = new T.Vector3()) {
        const angle = t * Math.PI * 2;
        return target.set(Math.cos(angle) * 3.3, Math.sin(angle) * .6 - .3, Math.sin(angle) * 1.65);
      }
    }
    const curve = new RibbonCurve();
    const orbit = new T.Group(); orbit.rotation.z = -.17; scene.add(orbit);
    const positions = [], uvs = [], indices = [];
    const segments = mobile ? 96 : 180;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, p = curve.getPoint(t);
      for (const side of [-1, 1]) { positions.push(p.x, p.y + side * .15, p.z); uvs.push(t, (side + 1) / 2); }
      if (i < segments) { const j = i * 2; indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
    }
    const path = keep(new T.BufferGeometry());
    path.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    path.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); path.setIndex(indices); path.computeVertexNormals();
    const head = { value: 0 }, active = { value: 0 };
    function ribbonMaterial(strength) {
      return keep(new T.ShaderMaterial({
        uniforms: { uHead: head, uActive: active, uStrength: { value: strength } },
        vertexShader: 'varying vec2 vUv; void main() { vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform float uHead, uActive, uStrength;
          void main() {
            float crossSection = abs(vUv.y - .5) * 2.0;
            float core = exp(-crossSection * crossSection * 80.0);
            float halo = exp(-crossSection * crossSection * 5.0);
            float tail = exp(-3.0 * fract(uHead - vUv.x + 1.0));
            vec3 color = mix(vec3(1.0,.38,.025), vec3(1.0,.82,.3), core);
            gl_FragColor=vec4(color, (core + halo * .48) * (.25 + tail) * uActive * uStrength);
          }`,
        transparent: true, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false
      }));
    }
    orbit.add(new T.Mesh(path, ribbonMaterial(1)));
    const reflectedOrbit = new T.Group(); reflectedOrbit.scale.y = -1; reflectedOrbit.position.y = -2;
    reflectedOrbit.rotation.z = .17; reflectedOrbit.add(new T.Mesh(path, ribbonMaterial(.24))); scene.add(reflectedOrbit);
    const tipMaterial = keep(new T.SpriteMaterial({ map: glowMap, color: 0xffb851, transparent: true,
      opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const tip = new T.Sprite(tipMaterial); tip.scale.set(.85, .85, 1); orbit.add(tip);
    const flareMaterial = keep(tipMaterial.clone());
    const flare = new T.Sprite(flareMaterial); flare.scale.set(2.1, .065, 1); orbit.add(flare);
    const amberLight = new T.PointLight(0xffa329, 0, 9, 2); scene.add(amberLight);

    const dustPositions = [];
    for (let i = 0; i < (mobile ? 20 : 65); i++) {
      dustPositions.push(Math.sin(i * 127.1) * 6, Math.sin(i * 311.7) * 3, -2 + Math.cos(i * 74.7) * 3);
    }
    const dustGeometry = keep(new T.BufferGeometry()); dustGeometry.setAttribute('position', new T.Float32BufferAttribute(dustPositions, 3));
    const dustMaterial = keep(new T.PointsMaterial({ color: 0xffd292, size: .028, map: glowMap,
      transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
    const dust = new T.Points(dustGeometry, dustMaterial); scene.add(dust);
    let distance;
    function resize() {
      camera.aspect = innerWidth / innerHeight;
      distance = Math.max(10, 10.8 / camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5));
      renderer.setSize(innerWidth, innerHeight);
    }
    resize();
    return {
      resize, dispose,
      render(seconds) {
        sweep.value = -3.6 + ease(clamp((seconds - .2) / .8)) * 7.2;
        reveal.value = clamp((seconds - .2) / .25);
        const atmosphereFade = ease(clamp((seconds - .75) / 1.4));
        fogTime.value = seconds; fogOpacity.value = atmosphereFade * .16;
        const approach = ease(clamp((seconds - 2.5) / 1));
        camera.position.set(.6 * (1 - approach) + .08, .85 - approach * .22,
          distance - clamp(seconds / 2.5) * .25 - approach * 1.35);
        camera.lookAt(0, .15, 0);
        for (const item of atmosphere) {
          item.sprite.material.opacity = item.opacity * atmosphereFade;
          item.sprite.position.x = item.x + Math.sin(seconds * .45) * .28;
        }
        head.value = .05 + Math.max(0, seconds - 1) * .48;
        active.value = ease(clamp((seconds - 1) / .65));
        curve.getPoint(head.value % 1, tip.position); flare.position.copy(tip.position);
        tipMaterial.opacity = active.value * .9;
        flareMaterial.opacity = active.value * (.2 + .4 * Math.pow(Math.max(0, Math.sin(seconds * 2.5)), 8));
        orbit.rotation.y = -.2 + seconds * .12; reflectedOrbit.rotation.y = orbit.rotation.y;
        orbit.updateMatrixWorld(); amberLight.position.copy(tip.position); orbit.localToWorld(amberLight.position);
        amberLight.intensity = active.value * 9;
        const pulse = .82 + .18 * Math.sin(seconds * 3.4);
        for (const { material, strength } of ringMaterials) material.opacity = atmosphereFade * strength * pulse;
        rings.children.forEach((ring, i) => { ring.rotation.z = seconds * (i ? -.16 : .13); });
        dustMaterial.opacity = atmosphereFade * .6;
        dust.position.y = seconds * .055;
        renderer.render(scene, camera);
      }
    };
  } catch (error) { dispose(); throw error; }
}
