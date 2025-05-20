import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { HallwayGenerator } from './hallwayGenerator.js';
import { WallObjectGenerator } from './hallwayObjects.js';
import { HallwayLights } from './hallwayLights.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101018);
scene.fog = new THREE.Fog(0x000000, 5, 35);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.7;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting (Ambient)
const ambientLight = new THREE.AmbientLight(0x303040, 0.6);
scene.add(ambientLight);

// Controls
const controls = new PointerLockControls(camera, document.body);

// Hallway Configuration
const segmentLength = 5;
const hallwayWidth = 3;
const hallwayHeight = 3;

// Create hallway generator
const hallwayGenerator = new HallwayGenerator(scene, {
    segmentLength: segmentLength,
    hallwayWidth: hallwayWidth,
    hallwayHeight: hallwayHeight,
    maxSegmentsInMemory: 60, 
    generationTriggerFactor: 5, 
    visibleDistance: 40, 
    minTurnSegments: 4,
    maxTurnSegments: 8,
});

// Create and add wall generator
const wallGenerator = new WallObjectGenerator({
    hallwayWidth: hallwayWidth,
    hallwayHeight: hallwayHeight,
});
hallwayGenerator.addObjectGenerator(wallGenerator);

// Initialize hallway (generates initial segments)
hallwayGenerator.initialize();

// Create Hallway Lights manager
const hallwayLights = new HallwayLights(scene, hallwayGenerator, {
    maxLights: 12,
    lightColor: 0xffeedd, 
    lightIntensity: 1.2,
    lightDistance: 18,
    lightVisibilityDistance: 45, 
    lightHeightOffset: hallwayHeight - 0.4, 
});

// Movement variables
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Update game logic
function updateGameLogic() {
    const playerPosition = controls.getObject().position;
    hallwayGenerator.update(playerPosition);
    hallwayLights.update(playerPosition);
}

// Event listeners
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', function () {
    controls.lock();
});

controls.addEventListener('lock', function () {
    instructions.classList.add('hidden');
});

controls.addEventListener('unlock', function () {
    instructions.classList.remove('hidden');
});

document.addEventListener('keydown', function (event) {
    switch (event.code) {
        case 'KeyW': case 'ArrowUp': moveForward = true; break;
        case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
        case 'KeyS': case 'ArrowDown': moveBackward = true; break;
        case 'KeyD': case 'ArrowRight': moveRight = true; break;
    }
});

document.addEventListener('keyup', function (event) {
    switch (event.code) {
        case 'KeyW': case 'ArrowUp': moveForward = false; break;
        case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
        case 'KeyS': case 'ArrowDown': moveBackward = false; break;
        case 'KeyD': case 'ArrowRight': moveRight = false; break;
    }
});

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const playerSpeed = 5.0; 
const clock = new THREE.Clock();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const delta = clock.getDelta();

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        
        // Normalize for consistent speed, only if there's movement
        if (direction.x !== 0 || direction.z !== 0) {
            direction.normalize();
        }

        const currentSpeedDelta = playerSpeed * delta;
        if (direction.z !== 0) controls.moveForward(direction.z * currentSpeedDelta);
        if (direction.x !== 0) controls.moveRight(direction.x * currentSpeedDelta);

        updateGameLogic();
    }

    renderer.render(scene, camera);
}

animate();