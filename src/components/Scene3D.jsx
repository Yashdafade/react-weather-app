import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Sun() {
  const sunRef = useRef();
  const raysRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sunRef.current) {
      sunRef.current.rotation.y = t * 0.1;
      sunRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.05);
    }
    if (raysRef.current) {
      raysRef.current.rotation.z = t * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.8 + Math.sin(t * 0.3) * 0.2);
    }
  });

  return (
    <group position={[2, 2, -3]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.15} />
      </mesh>
      <mesh ref={sunRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          emissive="#FDB813"
          emissiveIntensity={2}
          color="#FFD700"
          toneMapped={false}
        />
      </mesh>
      <mesh ref={raysRef}>
        <torusGeometry args={[1.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.6} />
      </mesh>
      <mesh ref={raysRef}>
        <torusGeometry args={[2, 0.015, 16, 100]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.3} />
      </mesh>
      <pointLight color="#FDB813" intensity={3} distance={20} />
    </group>
  );
}

function WarmParticles({ count = 200 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10 - 5],
        speed: 0.002 + Math.random() * 0.005,
        offset: Math.random() * Math.PI * 2,
        scale: 0.02 + Math.random() * 0.04,
      });
    }
    return temp;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.position[0] + Math.sin(t * p.speed * 100 + p.offset) * 0.5,
        p.position[1] + Math.cos(t * p.speed * 80 + p.offset) * 0.3,
        p.position[2]
      );
      dummy.scale.setScalar(p.scale * (1 + Math.sin(t * 2 + p.offset) * 0.5));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#FFD700" transparent opacity={0.6} />
    </instancedMesh>
  );
}

function SunnyScene() {
  return (
    <>
      <ambientLight intensity={0.4} color="#FFF3E0" />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#FFD700" />
      <fog attach="fog" args={['#1a237e', 8, 30]} />
      <Sun />
      <WarmParticles count={150} />
      <Stars radius={50} depth={50} count={1000} factor={2} saturation={0.5} fade speed={0.5} />
    </>
  );
}

function RainDrops({ count = 1500 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const drops = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 20,
        z: (Math.random() - 0.5) * 15 - 5,
        speed: 0.15 + Math.random() * 0.2,
        length: 0.1 + Math.random() * 0.15,
      });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    drops.forEach((drop, i) => {
      drop.y -= drop.speed;
      if (drop.y < -10) {
        drop.y = 15;
        drop.x = (Math.random() - 0.5) * 30;
      }
      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.scale.set(0.01, drop.length, 0.01);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <cylinderGeometry args={[0.5, 0.5, 1, 4]} />
      <meshBasicMaterial color="#7CB9E8" transparent opacity={0.5} />
    </instancedMesh>
  );
}

function RainyScene() {
  return (
    <>
      <ambientLight intensity={0.2} color="#455A64" />
      <directionalLight position={[0, 5, 0]} intensity={0.3} color="#78909C" />
      <fog attach="fog" args={['#1B2838', 5, 25]} />
      <RainDrops count={1200} />
      <CloudMeshes count={8} darkMode />
    </>
  );
}

function CloudMesh({ position, scale, speed, darkMode }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.sin(t * speed) * 2;
      groupRef.current.position.y = position[1] + Math.sin(t * speed * 0.5) * 0.3;
    }
  });

  const color = darkMode ? '#546E7A' : '#CFD8DC';
  const opacity = darkMode ? 0.7 : 0.8;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[1.2, -0.1, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[-1, -0.1, 0.3]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[0.5, 0.4, -0.2]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={1} />
      </mesh>
      <mesh position={[-0.5, 0.3, 0.2]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={1} />
      </mesh>
    </group>
  );
}

function CloudMeshes({ count = 6, darkMode = false }) {
  const clouds = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [(Math.random() - 0.5) * 20, 2 + Math.random() * 4, -5 - Math.random() * 10],
        scale: [0.8 + Math.random() * 1.2, 0.6 + Math.random() * 0.8, 0.8 + Math.random()],
        speed: 0.05 + Math.random() * 0.1,
      });
    }
    return temp;
  }, [count]);

  return clouds.map((cloud, i) => (
    <CloudMesh key={i} {...cloud} darkMode={darkMode} />
  ));
}

function CloudyScene() {
  return (
    <>
      <ambientLight intensity={0.5} color="#B0BEC5" />
      <directionalLight position={[3, 5, 2]} intensity={0.5} color="#ECEFF1" />
      <fog attach="fog" args={['#546E7A', 5, 25]} />
      <CloudMeshes count={12} />
      <WarmParticles count={50} />
    </>
  );
}

function Snowflakes({ count = 800 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const flakes = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 20,
        z: (Math.random() - 0.5) * 15 - 5,
        speed: 0.02 + Math.random() * 0.04,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.5 + Math.random() * 1.5,
        scale: 0.03 + Math.random() * 0.06,
      });
    }
    return temp;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    flakes.forEach((flake, i) => {
      flake.y -= flake.speed;
      if (flake.y < -10) {
        flake.y = 15;
        flake.x = (Math.random() - 0.5) * 30;
      }
      dummy.position.set(
        flake.x + Math.sin(t * flake.wobbleSpeed + flake.wobble) * 0.5,
        flake.y,
        flake.z
      );
      dummy.rotation.set(t * 0.5, t * 0.3, t * 0.4);
      dummy.scale.setScalar(flake.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
    </instancedMesh>
  );
}

function SnowyScene() {
  return (
    <>
      <ambientLight intensity={0.6} color="#E3F2FD" />
      <directionalLight position={[2, 5, 3]} intensity={0.4} color="#BBDEFB" />
      <fog attach="fog" args={['#37474F', 5, 25]} />
      <Snowflakes count={600} />
      <CloudMeshes count={5} />
    </>
  );
}

function Lightning() {
  const lightRef = useRef();
  const nextFlash = useRef(Math.random() * 3 + 1);
  const flashDuration = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      if (t > nextFlash.current && flashDuration.current <= 0) {
        flashDuration.current = 0.1 + Math.random() * 0.15;
        nextFlash.current = t + 2 + Math.random() * 5;
        lightRef.current.intensity = 5 + Math.random() * 10;
      }
      if (flashDuration.current > 0) {
        flashDuration.current -= 0.016;
        lightRef.current.intensity *= 0.85;
      } else {
        lightRef.current.intensity = 0;
      }
    }
  });

  return <pointLight ref={lightRef} position={[0, 8, -3]} color="#E1F5FE" intensity={0} distance={30} />;
}

function ThunderstormScene() {
  return (
    <>
      <ambientLight intensity={0.1} color="#263238" />
      <fog attach="fog" args={['#0D1117', 3, 20]} />
      <Lightning />
      <Lightning />
      <RainDrops count={2000} />
      <CloudMeshes count={10} darkMode />
    </>
  );
}

function FogLayers() {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.x = Math.sin(t * 0.1 + i * 0.5) * 2;
        child.position.z = Math.cos(t * 0.08 + i * 0.3) * 1;
        child.material.opacity = 0.1 + Math.sin(t * 0.2 + i) * 0.05;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8, -3 - i * 0.5]} rotation={[0, 0, Math.random() * 0.5]}>
          <planeGeometry args={[15, 8]} />
          <meshBasicMaterial color="#90A4AE" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function MistScene() {
  return (
    <>
      <ambientLight intensity={0.4} color="#B0BEC5" />
      <fog attach="fog" args={['#78909C', 2, 12]} />
      <FogLayers />
      <WarmParticles count={30} />
    </>
  );
}

function DrizzleScene() {
  return (
    <>
      <ambientLight intensity={0.35} color="#607D8B" />
      <directionalLight position={[2, 5, 2]} intensity={0.4} color="#90A4AE" />
      <fog attach="fog" args={['#37474F', 5, 22]} />
      <RainDrops count={500} />
      <CloudMeshes count={6} darkMode />
      <FogLayers />
    </>
  );
}

function DefaultScene() {
  return (
    <>
      <ambientLight intensity={0.3} color="#7C4DFF" />
      <directionalLight position={[3, 5, 2]} intensity={0.5} color="#B388FF" />
      <fog attach="fog" args={['#1a237e', 8, 30]} />
      <Stars radius={50} depth={50} count={2000} factor={3} saturation={0.8} fade speed={1} />
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0, 0, -5]}>
          <icosahedronGeometry args={[2, 1]} />
          <meshStandardMaterial
            color="#7C4DFF"
            emissive="#4A148C"
            emissiveIntensity={0.5}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </Float>
      <Float speed={0.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh position={[-3, 2, -8]}>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial
            color="#00BCD4"
            emissive="#006064"
            emissiveIntensity={0.3}
            wireframe
            transparent
            opacity={0.2}
          />
        </mesh>
      </Float>
      <Float speed={0.8} rotationIntensity={0.4} floatIntensity={0.8}>
        <mesh position={[4, -1, -6]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#FF4081"
            emissive="#880E4F"
            emissiveIntensity={0.3}
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>
      </Float>
      <WarmParticles count={100} />
    </>
  );
}

const sceneMap = {
  Clear: SunnyScene,
  Clouds: CloudyScene,
  Rain: RainyScene,
  Drizzle: DrizzleScene,
  Snow: SnowyScene,
  Thunderstorm: ThunderstormScene,
  Mist: MistScene,
  Smoke: MistScene,
  Haze: MistScene,
  Fog: MistScene,
  Dust: MistScene,
};

const WeatherCanvas = React.memo(function WeatherCanvas({ weatherCondition }) {
  const SceneComponent = sceneMap[weatherCondition] || DefaultScene;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneComponent />
      </Canvas>
    </div>
  );
});

export default WeatherCanvas;
