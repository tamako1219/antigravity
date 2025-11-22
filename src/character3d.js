import * as THREE from 'three';

export class Character3D {
    constructor() {
        this.mesh = new THREE.Group();
        this.time = 0;

        // Movement State
        this.velocity = new THREE.Vector3();
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.init();
    }

    init() {
        // Materials
        const blackMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.3,
            metalness: 0.8
        });

        const silverMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.2,
            metalness: 1.0
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.2,
            metalness: 1.0,
            emissive: 0xaa8800,
            emissiveIntensity: 0.2
        });

        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.8
        });

        // --- Head ---
        const headGroup = new THREE.Group();

        // Helmet
        const headGeo = new THREE.IcosahedronGeometry(1, 1);
        const head = new THREE.Mesh(headGeo, blackMat);
        headGroup.add(head);

        // Visor (Gold)
        const visorGeo = new THREE.BoxGeometry(1.2, 0.4, 0.8);
        const visor = new THREE.Mesh(visorGeo, goldMat);
        visor.position.set(0, 0.1, 0.4);
        headGroup.add(visor);

        // Ears (Silver)
        const earGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.2, 8);
        const ear = new THREE.Mesh(earGeo, silverMat);
        ear.rotation.z = Math.PI / 2;
        headGroup.add(ear);

        headGroup.position.y = 1.5;
        this.mesh.add(headGroup);
        this.head = headGroup; // Save for animation

        // --- Body ---
        const bodyGroup = new THREE.Group();

        // Core (Black)
        const coreGeo = new THREE.CylinderGeometry(0.8, 0.6, 1.5, 8);
        const core = new THREE.Mesh(coreGeo, blackMat);
        bodyGroup.add(core);

        // Chest Plate (Silver)
        const chestGeo = new THREE.BoxGeometry(1.4, 0.8, 1);
        const chest = new THREE.Mesh(chestGeo, silverMat);
        chest.position.y = 0.3;
        bodyGroup.add(chest);

        // Glowing Heart (Gold)
        const heartGeo = new THREE.OctahedronGeometry(0.3);
        const heart = new THREE.Mesh(heartGeo, glowMat);
        heart.position.set(0, 0.3, 0.55);
        bodyGroup.add(heart);
        this.heart = heart;

        this.mesh.add(bodyGroup);
        this.body = bodyGroup;

        // --- Arms ---
        const createArm = (x) => {
            const armGroup = new THREE.Group();

            // Shoulder
            const shoulderGeo = new THREE.SphereGeometry(0.5);
            const shoulder = new THREE.Mesh(shoulderGeo, goldMat);
            armGroup.add(shoulder);

            // Upper Arm
            const upperArmGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2);
            const upperArm = new THREE.Mesh(upperArmGeo, blackMat);
            upperArm.position.y = -0.8;
            armGroup.add(upperArm);

            // Forearm
            const forearmGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
            const forearm = new THREE.Mesh(forearmGeo, silverMat);
            forearm.position.y = -2;
            armGroup.add(forearm);

            armGroup.position.set(x, 1.2, 0);
            return armGroup;
        };

        this.leftArm = createArm(-1.4);
        this.rightArm = createArm(1.4);
        this.mesh.add(this.leftArm);
        this.mesh.add(this.rightArm);

        // --- Floating Rings (Gold) ---
        const ringGeo = new THREE.TorusGeometry(2.5, 0.05, 8, 50);
        const ring1 = new THREE.Mesh(ringGeo, goldMat);
        const ring2 = new THREE.Mesh(ringGeo, goldMat);

        ring1.rotation.x = Math.PI / 2;
        ring2.rotation.x = Math.PI / 2;
        ring2.rotation.y = Math.PI / 4;

        this.mesh.add(ring1);
        this.mesh.add(ring2);
        this.rings = [ring1, ring2];
    }

    update(time) {
        this.time += 0.01;

        // --- Movement Logic ---
        const speed = 0.2;
        const friction = 0.9;

        if (this.input.forward) this.velocity.z -= speed * 0.1; // Move away (negative Z)
        if (this.input.backward) this.velocity.z += speed * 0.1;
        if (this.input.left) this.velocity.x -= speed * 0.1;
        if (this.input.right) this.velocity.x += speed * 0.1;

        // Apply velocity
        this.mesh.position.add(this.velocity);

        // Friction
        this.velocity.multiplyScalar(friction);

        // Tilt based on velocity
        this.mesh.rotation.z = -this.velocity.x * 2; // Bank turn
        this.mesh.rotation.x = this.velocity.z * 2;  // Pitch forward/back

        // Floating effect (layered on top of position)
        this.mesh.position.y = Math.sin(this.time) * 0.5;

        // Breathing (Heart pulse)
        const scale = 1 + Math.sin(this.time * 3) * 0.2;
        this.heart.scale.set(scale, scale, scale);

        // Subtle Head Rotation
        this.head.rotation.y = Math.sin(this.time * 0.5) * 0.2 + (this.velocity.x * 5); // Look into turn
        this.head.rotation.x = Math.sin(this.time * 0.3) * 0.1;

        // Arm Sway
        this.leftArm.rotation.z = 0.2 + Math.sin(this.time + 1) * 0.1;
        this.rightArm.rotation.z = -0.2 - Math.sin(this.time + 1) * 0.1;

        // Ring Rotation
        this.rings[0].rotation.x = Math.PI / 2 + this.time * 0.5;
        this.rings[0].rotation.y = this.time * 0.3;

        this.rings[1].rotation.x = Math.PI / 2 - this.time * 0.4;
        this.rings[1].rotation.y = -this.time * 0.2;

        // Overall slow rotation (disabled when moving for better control feel)
        // this.mesh.rotation.y = this.time * 0.1; 
    }

    setInput(key, active) {
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.input.forward = active;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.input.backward = active;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.input.left = active;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.input.right = active;
                break;
        }
    }
}
