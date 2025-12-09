import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Image, Billboard, ScrollControls, useScroll, Scroll } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group } from 'three';
import Overlay from './Overlay';

const Character = () => {
  const group = useRef<Group>(null);
  const scroll = useScroll();

  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      // Scroll based animation
      // range(0, 1/3) -> First section (Hero) to Second (Features)
      const r1 = scroll.range(0, 1 / 3);
      // range(1/3, 1/3) -> Second section
      const r2 = scroll.range(1 / 3, 1 / 3);

      // WASD Movement
      const speed = 10 * delta;
      if (keys.current['KeyW'] || keys.current['ArrowUp']) group.current.position.y += speed;
      if (keys.current['KeyS'] || keys.current['ArrowDown']) group.current.position.y -= speed;
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) group.current.position.x -= speed;
      if (keys.current['KeyD'] || keys.current['ArrowRight']) group.current.position.x += speed;

      // Move character to the right as we scroll down to features
      // And then back to center/left for the next section
      // group.current.position.x = 10 * r1 - (20 * r2);

      // Rotate character
      group.current.rotation.z = -0.2 * r1 + (0.4 * r2);

      // Scale down slightly then back up
      const scale = 1 - (0.2 * r1) + (0.2 * r2);
      group.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Image
            url="/character.png"
            scale={[5, 5]}
            transparent
            toneMapped={false}
          />
        </Billboard>
      </Float>
    </group>
  );
};

const ThreeScene = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#000000'
    }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0055" />

        <ScrollControls pages={3} damping={0.2}>
          <Character />
          <Scroll html style={{ width: '100%' }}>
            <Overlay />
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
};

export default ThreeScene;
