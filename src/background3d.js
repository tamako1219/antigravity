import * as THREE from 'three';

export class Background3D {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = [];
        this.mouseX = 0;
        this.mouseY = 0;

        this.init();
        this.animate();
        this.addListeners();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        // Dark background to match the app theme
        this.scene.background = new THREE.Color(0x1a0b2e);
        // Fog for depth
        this.scene.fog = new THREE.FogExp2(0x1a0b2e, 0.002);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;
        this.camera.position.y = 10;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Objects
        this.createGrid();
        this.createParticles();

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xff00cc, 1, 100);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        const blueLight = new THREE.PointLight(0x00d2ff, 1, 100);
        blueLight.position.set(-10, -10, 10);
        this.scene.add(blueLight);
    }

    createGrid() {
        const geometry = new THREE.PlaneGeometry(200, 200, 40, 40);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff00cc,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -10;
        this.scene.add(plane);
        this.objects.push({ mesh: plane, type: 'grid' });
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 200;
            vertices.push(x, y, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            color: 0x00d2ff,
            size: 0.5,
            transparent: true,
            opacity: 0.6
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.objects.push({ mesh: particles, type: 'particles' });
    }

    addListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
            this.mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Camera movement based on mouse
        this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouseY + 10 - this.camera.position.y) * 0.05;
        this.camera.lookAt(0, 0, 0);

        // Animation
        this.objects.forEach(obj => {
            if (obj.type === 'grid') {
                // Moving grid effect
                obj.mesh.position.z = (Date.now() * 0.005) % 5;
            }
            if (obj.type === 'particles') {
                obj.mesh.rotation.y += 0.001;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}
