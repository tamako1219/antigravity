import { Canvas } from '@react-three/fiber';
import { OrbitControls, Image, Billboard, Stars } from '@react-three/drei';

const Character = () => {
  return (
    <Billboard
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false} // Lock the rotation on the Z axis (default=false)
    >
      <Image 
        url="/character.png" 
        scale={[4, 4]} // Adjust scale as needed based on image aspect ratio
        transparent
        toneMapped={false}
      />
    </Billboard>
  );
};

const ThreeScene = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Character />
        
        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
};

export default ThreeScene;
