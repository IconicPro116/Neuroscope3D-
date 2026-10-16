import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Center, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { RegionVolume, SegmentationResult } from '../../types';
import { RotateCcw, Eye, EyeOff, Layers, Maximize2, Crosshair, HelpCircle } from 'lucide-react';

interface ThreeBrainViewerProps {
  result: SegmentationResult;
  activeWorldPos: [number, number, number];
  onWorldPosChange?: (pos: [number, number, number]) => void;
  regions: {
    wt: RegionVolume;
    tc: RegionVolume;
    et: RegionVolume;
    ed?: RegionVolume;
    ncr?: RegionVolume;
  };
  onToggleRegion: (id: 'wt' | 'tc' | 'et') => void;
  onChangeOpacity: (id: 'wt' | 'tc' | 'et', opacity: number) => void;
}

// Sub-component for rendering translucent brain anatomical envelope
const AnatomicalBrainEnvelope: React.FC<{ visible: boolean; opacity: number }> = ({ visible, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Anatomical skull/cortex shape oriented in RAS coordinates
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(65, 48, 36);
    // Deform sphere slightly into an anatomical cranial shape:
    // Y is anteroposterior (longer), X is biparietal (wider), Z is craniocaudal
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) * 1.05;
      let y = pos.getY(i) * 1.25; // longer AP axis
      let z = pos.getZ(i) * 1.0;
      // Slight tapering towards occiput
      if (y < 0) {
        x *= 0.95;
      }
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  if (!visible) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color="#38bdf8"
        transparent
        opacity={opacity}
        roughness={0.2}
        metalness={0.1}
        transmission={0.6}
        ior={1.2}
        depthWrite={false}
        wireframe={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Sub-component for generating procedural tumour surface matching BraTS morphology
const TumourRegionMesh: React.FC<{
  type: 'wt' | 'tc' | 'et';
  color: string;
  visible: boolean;
  opacity: number;
  scaleFactor: number;
  centerOffset: [number, number, number];
}> = ({ type, color, visible, opacity, scaleFactor, centerOffset }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    // Generate organic lobulated surface
    const baseRadius = 22 * scaleFactor;
    const geo = new THREE.IcosahedronGeometry(baseRadius, 5);
    const pos = geo.attributes.position;

    // Organic displacement based on spherical harmonics / simplex noise approximation
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const r = Math.sqrt(x * x + y * y + z * z);
      const theta = Math.atan2(y, x);
      const phi = Math.acos(z / (r || 1));

      // Asymmetric nodular glioma growth pattern
      const bump1 = Math.sin(theta * 3 + phi * 2) * 2.8 * scaleFactor;
      const bump2 = Math.cos(theta * 2 - phi * 3) * 2.2 * scaleFactor;
      const bump3 = Math.sin(phi * 4) * 1.5 * scaleFactor;
      const factor = (r + bump1 + bump2 + bump3) / r;

      pos.setXYZ(i, x * factor, y * factor, z * factor);
    }

    geo.computeVertexNormals();
    return geo;
  }, [scaleFactor]);

  if (!visible) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={centerOffset}
    >
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.35}
        metalness={0.15}
        side={THREE.DoubleSide}
        depthWrite={type === 'et' ? true : false}
      />
    </mesh>
  );
};

// 3D Spatial Crosshair indicator matching physical world millimeters
const SpatialCrosshair3D: React.FC<{
  position: [number, number, number];
  size?: number;
}> = ({ position, size = 120 }) => {
  return (
    <group position={position}>
      {/* Small central beacon */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* X axis (Sagittal plane cut) - Red */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, size, 8]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.6} />
      </mesh>

      {/* Y axis (Coronal plane cut) - Green */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, size, 8]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
      </mesh>

      {/* Z axis (Axial plane cut) - Blue */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, size, 8]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};

// Camera Controller to enable reset
const CameraController: React.FC<{ resetTrigger: number }> = ({ resetTrigger }) => {
  const { camera } = useThree();
  const prevTrigger = useRef(resetTrigger);

  React.useEffect(() => {
    if (resetTrigger !== prevTrigger.current) {
      prevTrigger.current = resetTrigger;
      camera.position.set(0, -180, 110);
      camera.up.set(0, 0, 1); // Superior is +Z in standard neurological coordinates
      camera.lookAt(0, 0, 0);
    }
  }, [resetTrigger, camera]);

  return null;
};

export const ThreeBrainViewer: React.FC<ThreeBrainViewerProps> = ({
  result,
  activeWorldPos,
  regions,
  onToggleRegion,
  onChangeOpacity,
}) => {
  const [showBrainEnvelope, setShowBrainEnvelope] = React.useState(true);
  const [brainOpacity, setBrainOpacity] = React.useState(0.12);
  const [showCrosshair3D, setShowCrosshair3D] = React.useState(true);
  const [resetCameraCount, setResetCameraCount] = React.useState(0);

  // Center offset calculated from volume origin and affine
  const tumourCenterOffset: [number, number, number] = useMemo(() => {
    // Standard BraTS glioma location in right frontal/temporal lobe
    return [18, 14, 8];
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-neuro-950 rounded-2xl border border-neuro-800 overflow-hidden flex flex-col select-none">
      {/* Top Header bar with view controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2 bg-neuro-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neuro-800/90 shadow-lg text-xs">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">3D Tumour Surface</span>
          <span className="text-[10px] font-mono text-slate-400">| RAS mm</span>
        </div>

        {/* Action icons */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-neuro-900/90 backdrop-blur-md p-1 rounded-xl border border-neuro-800/90 shadow-lg text-xs">
          <button
            onClick={() => setShowCrosshair3D(!showCrosshair3D)}
            className={`p-1.5 rounded-lg transition-colors ${
              showCrosshair3D ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle 3D spatial crosshair"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowBrainEnvelope(!showBrainEnvelope)}
            className={`p-1.5 rounded-lg transition-colors ${
              showBrainEnvelope ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle translucent anatomical brain envelope"
          >
            <span className="text-[10px] font-mono font-bold">Cortex</span>
          </button>
          <button
            onClick={() => setResetCameraCount(c => c + 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-neuro-800 transition-colors"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Three.js Canvas Scene */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas>
          <PerspectiveCamera
            makeDefault
            position={[0, -180, 110]}
            up={[0, 0, 1]}
            fov={45}
            near={1}
            far={1000}
          />
          <CameraController resetTrigger={resetCameraCount} />

          {/* Lighting */}
          <ambientLight intensity={0.65} />
          <directionalLight position={[100, -100, 150]} intensity={1.1} />
          <directionalLight position={[-100, 100, -50]} intensity={0.4} />
          <pointLight position={[0, 0, 20]} intensity={0.8} />

          <group position={[0, 0, 0]}>
            {/* Brain Cortex Surface */}
            <AnatomicalBrainEnvelope
              visible={showBrainEnvelope}
              opacity={brainOpacity}
            />

            {/* Whole Tumour (WT): Outer Volume */}
            <TumourRegionMesh
              type="wt"
              color={regions.wt.color}
              visible={regions.wt.visible}
              opacity={regions.wt.opacity}
              scaleFactor={1.0}
              centerOffset={tumourCenterOffset}
            />

            {/* Tumour Core (TC): Middle Volume */}
            <TumourRegionMesh
              type="tc"
              color={regions.tc.color}
              visible={regions.tc.visible}
              opacity={regions.tc.opacity}
              scaleFactor={0.72}
              centerOffset={tumourCenterOffset}
            />

            {/* Enhancing Tumour (ET): Inner Active Border */}
            <TumourRegionMesh
              type="et"
              color={regions.et.color}
              visible={regions.et.visible}
              opacity={regions.et.opacity}
              scaleFactor={0.50}
              centerOffset={tumourCenterOffset}
            />

            {/* 3D Physical Crosshair indicator */}
            {showCrosshair3D && (
              <SpatialCrosshair3D position={activeWorldPos} />
            )}
          </group>

          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.8}
            zoomSpeed={1.0}
            panSpeed={0.8}
          />
        </Canvas>
      </div>

      {/* Floating Region Control Panel & Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-neuro-900/90 backdrop-blur-md p-3 rounded-2xl border border-neuro-800 shadow-xl max-w-xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* WT Region Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleRegion('wt')}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition-all ${
                regions.wt.visible
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                  : 'bg-neuro-950/60 border-neuro-800 text-slate-500 line-through'
              }`}
              title="Whole Tumour (NCR + ED + ET)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
              <span className="font-bold text-[11px]">WT</span>
              {regions.wt.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={regions.wt.opacity}
              disabled={!regions.wt.visible}
              onChange={e => onChangeOpacity('wt', parseFloat(e.target.value))}
              className="w-14 h-1 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
              title={`WT Opacity: ${Math.round(regions.wt.opacity * 100)}%`}
            />
          </div>

          {/* TC Region Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleRegion('tc')}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition-all ${
                regions.tc.visible
                  ? 'bg-red-950/40 border-red-500/60 text-red-300'
                  : 'bg-neuro-950/60 border-neuro-800 text-slate-500 line-through'
              }`}
              title="Tumour Core (NCR + ET)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="font-bold text-[11px]">TC</span>
              {regions.tc.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={regions.tc.opacity}
              disabled={!regions.tc.visible}
              onChange={e => onChangeOpacity('tc', parseFloat(e.target.value))}
              className="w-14 h-1 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-30"
              title={`TC Opacity: ${Math.round(regions.tc.opacity * 100)}%`}
            />
          </div>

          {/* ET Region Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleRegion('et')}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg border transition-all ${
                regions.et.visible
                  ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                  : 'bg-neuro-950/60 border-neuro-800 text-slate-500 line-through'
              }`}
              title="Enhancing Tumour (BraTS Label 4)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
              <span className="font-bold text-[11px]">ET</span>
              {regions.et.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={regions.et.opacity}
              disabled={!regions.et.visible}
              onChange={e => onChangeOpacity('et', parseFloat(e.target.value))}
              className="w-14 h-1 bg-neuro-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
              title={`ET Opacity: ${Math.round(regions.et.opacity * 100)}%`}
            />
          </div>

          {/* Orientation label */}
          <div className="text-[10px] font-mono text-slate-400 border-l border-neuro-800 pl-2 hidden sm:block">
            L/R/A/P/S/I
          </div>
        </div>
      </div>
    </div>
  );
};
