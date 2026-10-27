import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FlashElement } from '../../types/flash';

interface ThreeStageViewProps {
  elements: FlashElement[];
  width: number;
  height: number;
}

export const ThreeStageView: React.FC<ThreeStageViewProps> = ({ elements, width, height }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const elementsRef = useRef<FlashElement[]>(elements);

  elementsRef.current = elements;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene & Environment
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Camera matching 2D canvas coordinates dynamically for any resolution (1080p, 4K, etc.)
    const fov = 45;
    const cameraDist = height / (2 * Math.tan((fov * Math.PI) / 360));
    const camera = new THREE.PerspectiveCamera(fov, width / height, 1, cameraDist * 4);
    camera.position.set(0, 0, cameraDist);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(150, 250, 300);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x90c0ff, 0x303030, 0.9);
    scene.add(fillLight);

    // Mesh container
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Contact ground shadow plane
    const shadowGeo = new THREE.PlaneGeometry(600, 600);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -220;
    scene.add(shadowMesh);

    // Render loop
    let frameId = 0;
    let clock = new THREE.Clock();

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      const delta = clock.getDelta();

      // Update 3D objects
      if (meshGroupRef.current) {
        update3DObjects(meshGroupRef.current, elementsRef.current, width, height, delta);
      }

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

// Map 2D Stage (800x500 origin at top-left) to 3D Stage (origin at center)
function stageTo3D(x: number, y: number, stageW: number, stageH: number): { x: number; y: number } {
  return {
    x: x - stageW / 2,
    y: -(y - stageH / 2),
  };
}

// Procedural 3-12 Part Models
function createProceduralSpaceship(color: string): THREE.Group {
  const group = new THREE.Group();
  const matMain = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color || '#3b82f6'),
    metalness: 0.85,
    roughness: 0.25,
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.95,
    roughness: 0.15,
  });
  const matGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // 1. Hull
  const hullGeo = new THREE.ConeGeometry(24, 75, 8);
  const hull = new THREE.Mesh(hullGeo, matMain);
  hull.rotation.z = -Math.PI / 2;
  group.add(hull);

  // 2. Cockpit canopy
  const canopyGeo = new THREE.SphereGeometry(12, 16, 16);
  canopyGeo.scale(1.8, 0.7, 0.8);
  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.85,
    transparent: true,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(5, 7, 0);
  group.add(canopy);

  // 3 & 4. Wings
  const wingGeo = new THREE.BoxGeometry(32, 2.5, 70);
  const wings = new THREE.Mesh(wingGeo, matAccent);
  wings.position.set(-10, 0, 0);
  group.add(wings);

  // 5 & 6. Thrusters
  const thrusterGeo = new THREE.CylinderGeometry(5, 7, 18, 12);
  const t1 = new THREE.Mesh(thrusterGeo, matAccent);
  t1.rotation.z = Math.PI / 2;
  t1.position.set(-35, 4, 14);
  const t2 = t1.clone();
  t2.position.set(-35, 4, -14);
  group.add(t1, t2);

  // 7 & 8. Thruster Plasma exhaust
  const glowGeo = new THREE.ConeGeometry(4, 16, 8);
  const g1 = new THREE.Mesh(glowGeo, matGlow);
  g1.rotation.z = Math.PI / 2;
  g1.position.set(-45, 4, 14);
  const g2 = g1.clone();
  g2.position.set(-45, 4, -14);
  group.add(g1, g2);

  return group;
}

function createProceduralRobot(color: string): THREE.Group {
  const group = new THREE.Group();
  const matBody = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color || '#10b981'),
    metalness: 0.7,
    roughness: 0.3,
  });
  const matJoints = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.1 });
  const matVisor = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  // 1. Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(32, 38, 20), matBody);
  group.add(torso);

  // 2. Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 8, 12), matJoints);
  neck.position.y = 23;
  group.add(neck);

  // 3. Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(24, 22, 20), matBody);
  head.position.y = 36;
  group.add(head);

  // 4. Visor eye
  const visor = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 2), matVisor);
  visor.position.set(0, 37, 11);
  group.add(visor);

  // 5 & 6. Antennas
  const antGeo = new THREE.CylinderGeometry(1.5, 1.5, 12);
  const ant1 = new THREE.Mesh(antGeo, matJoints);
  ant1.position.set(10, 50, 0);
  const ant2 = ant1.clone();
  ant2.position.set(-10, 50, 0);
  group.add(ant1, ant2);

  // 7 & 8. Arms
  const armGeo = new THREE.CylinderGeometry(3.5, 3.5, 28, 10);
  const armL = new THREE.Mesh(armGeo, matBody);
  armL.position.set(-22, -2, 0);
  const armR = armL.clone();
  armR.position.set(22, -2, 0);
  group.add(armL, armR);

  return group;
}

function createProceduralGem(color: string): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(34, 1);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color || '#ec4899'),
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.75,
    ior: 1.8,
    clearcoat: 1.0,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const ringGeo = new THREE.TorusGeometry(46, 2, 8, 32);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  group.add(ring);

  return group;
}

function createProceduralCube(color: string): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(45, 45, 45);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color || '#f59e0b'),
    metalness: 0.8,
    roughness: 0.25,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
  );
  group.add(wire);
  return group;
}

function createProceduralSphere(color: string): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(30, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color || '#3b82f6'),
    metalness: 0.6,
    roughness: 0.2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Orbital ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(44, 2, 8, 36),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 })
  );
  ring.rotation.x = Math.PI / 2.5;
  group.add(ring);

  return group;
}

function update3DObjects(
  container: THREE.Group,
  elements: FlashElement[],
  width: number,
  height: number,
  delta: number
) {
  const threeElements = elements.filter((e) => e.type === 'threeObject');

  // Remove stale objects
  const currentIds = new Set(threeElements.map((e) => e.id));
  for (let i = container.children.length - 1; i >= 0; i--) {
    const child = container.children[i];
    if (child.name && !currentIds.has(child.name)) {
      container.remove(child);
    }
  }

  // Add or update
  for (const el of threeElements) {
    let meshGroup = container.getObjectByName(el.id) as THREE.Group | undefined;
    const modelType = el.threeData?.modelType || 'spaceship';
    const color = el.threeData?.color || el.fill || '#3b82f6';

    if (!meshGroup) {
      if (modelType === 'spaceship') meshGroup = createProceduralSpaceship(color);
      else if (modelType === 'robot') meshGroup = createProceduralRobot(color);
      else if (modelType === 'gem') meshGroup = createProceduralGem(color);
      else if (modelType === 'cube') meshGroup = createProceduralCube(color);
      else meshGroup = createProceduralSphere(color);

      meshGroup.name = el.id;
      container.add(meshGroup);
    }

    // Set position mapped from 2D Flash stage
    const p3d = stageTo3D(el.x, el.y, width, height);
    meshGroup.position.x = p3d.x;
    meshGroup.position.y = p3d.y;

    const s = el.scaleX || 1;
    meshGroup.scale.set(s, s, s);

    // Apply rotation
    const rx = (el.threeData?.rotX || 0) * (Math.PI / 180);
    const ry = (el.threeData?.rotY || 0) * (Math.PI / 180) + (el.rotation || 0) * (Math.PI / 180);
    const rz = (el.threeData?.rotZ || 0) * (Math.PI / 180);

    meshGroup.rotation.x = rx;
    meshGroup.rotation.y = ry;
    meshGroup.rotation.z = rz;

    // Smooth subtle continuous idle spin
    meshGroup.rotation.y += delta * 0.4;
  }
}
