import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205); // Deep space blue-black
scene.fog = new THREE.FogExp2(0x020205, 0.002);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Post-Processing
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 1.5; // Intensity of glow
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 100);
spotLight.position.set(10, 10, 10);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 1;
spotLight.decay = 2;
spotLight.distance = 200;
spotLight.castShadow = true;
scene.add(spotLight);

const pointLight = new THREE.PointLight(0x00ffff, 50, 100);
pointLight.position.set(-5, 5, 5);
scene.add(pointLight);

const pointLight2 = new THREE.PointLight(0xff00ff, 50, 100);
pointLight2.position.set(5, -5, 5);
scene.add(pointLight2);

// Main Object: Abstract Shape
const geometry = new THREE.TorusKnotGeometry(1.2, 0.4, 128, 32);
const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.1,
    transmission: 0.2, // Glass-like
    thickness: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: 0x111111,
    emissiveIntensity: 0.5
});
const torusKnot = new THREE.Mesh(geometry, material);
torusKnot.castShadow = true;
torusKnot.receiveShadow = true;
scene.add(torusKnot);

// Particles (Starfield)
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 3000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 30;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x88ccff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    // Smooth rotation
    torusKnot.rotation.y += 0.05 * (targetX - torusKnot.rotation.y);
    torusKnot.rotation.x += 0.05 * (targetY - torusKnot.rotation.x);
    torusKnot.rotation.z = elapsedTime * 0.1;

    // Floating animation for object
    torusKnot.position.y = Math.sin(elapsedTime * 0.5) * 0.2;

    // Particle animation
    particlesMesh.rotation.y = -elapsedTime * 0.02;
    particlesMesh.rotation.x = mouseX * 0.0001;

    // Use composer for rendering
    composer.render();
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
