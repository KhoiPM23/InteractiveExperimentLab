import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WorldData } from '../../../contracts/types';

interface WorldViewportProps {
  worldData: WorldData;
  wireframe: boolean;
  autoRotate: boolean;
}

export const WorldViewport: React.FC<WorldViewportProps> = ({ worldData, wireframe, autoRotate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 45, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. Terrain Mesh from WorldData
    const res = worldData.config.resolution;
    const worldSize = 40;
    const geometry = new THREE.PlaneGeometry(worldSize, worldSize, res - 1, res - 1);
    geometry.rotateX(-Math.PI / 2);

    const posAttr = geometry.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    const waterColor = new THREE.Color(0x0e7490); // Cyan/Deep Blue
    const sandColor = new THREE.Color(0xeab308); // Gold/Sand
    const grassColor = new THREE.Color(0x16a34a); // Lush Green
    const forestColor = new THREE.Color(0x14532d); // Dark Green
    const rockColor = new THREE.Color(0x64748b); // Slate Rock
    const snowColor = new THREE.Color(0xf8fafc); // White Snow

    const maxElevation = 12;

    for (let i = 0; i < posAttr.count; i++) {
      const h = worldData.heightmap[i] ?? 0;
      posAttr.setY(i, h * maxElevation);

      // Biome color assignment based on height
      const c = new THREE.Color();
      if (h <= worldData.config.waterLevel) {
        c.copy(waterColor);
      } else if (h <= worldData.config.waterLevel + 0.05) {
        c.copy(sandColor);
      } else if (h <= 0.55) {
        c.lerpColors(grassColor, forestColor, (h - 0.3) / 0.25);
      } else if (h <= 0.8) {
        c.lerpColors(forestColor, rockColor, (h - 0.55) / 0.25);
      } else {
        c.lerpColors(rockColor, snowColor, (h - 0.8) / 0.2);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: wireframe,
      flatShading: true,
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);

    // 4. Water plane
    const waterGeom = new THREE.PlaneGeometry(worldSize * 1.1, worldSize * 1.1);
    waterGeom.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      metalness: 0.4,
    });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.y = worldData.config.waterLevel * maxElevation;
    scene.add(waterMesh);

    // 5. Grid helper at base
    const gridHelper = new THREE.GridHelper(worldSize * 1.2, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 6. Interactive Orbit Controls (Lightweight, zero external dependency)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 75, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCamera = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 3, 0);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      spherical.theta -= dx * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - dy * 0.01));
      updateCamera();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(20, Math.min(130, spherical.radius + e.deltaY * 0.05));
      updateCamera();
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // 7. Render Loop with FPS Monitor
    let animationFrameId: number;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        spherical.theta += 0.003;
        updateCamera();
      }

      renderer.render(scene, camera);

      // FPS Calculation
      frameCountRef.current++;
      if (time - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (time - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      geometry.dispose();
      material.dispose();
      waterGeom.dispose();
      waterMat.dispose();
      renderer.dispose();
    };
  }, [worldData, wireframe, autoRotate]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-background">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute top-3 left-3 flex items-center space-x-2 bg-surface/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300 pointer-events-none">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Three.js WebGL</span>
        <span className="text-slate-500">|</span>
        <span className={fps < 45 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{fps} FPS</span>
        <span className="text-slate-500">|</span>
        <span>Mesh: {worldData.config.resolution}x{worldData.config.resolution}</span>
      </div>
      <div className="absolute bottom-3 left-3 bg-surface/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 pointer-events-none">
        Kéo chuột trái để xoay | Cuộn chuột để zoom
      </div>
    </div>
  );
};
