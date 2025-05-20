import * as THREE from 'three';

export class HallwayLights {
    constructor(scene, hallwayGenerator, config = {}) {
        this.scene = scene;
        this.hallwayGenerator = hallwayGenerator; 
        this.lights = [];
        this.maxLights = config.maxLights || 100;
        this.lightColor = config.lightColor || 0xffaa55;
        this.lightIntensity = config.lightIntensity || 0.8;
        this.lightDistance = config.lightDistance || 15; 
        this.lightVisibilityDistance = config.lightVisibilityDistance || 30;
        this.lightHeightOffset = config.lightHeightOffset || 2.5; 
    }

    createPointLight(position) {
        const light = new THREE.PointLight(this.lightColor, this.lightIntensity, this.lightDistance);
        light.position.copy(position);
        light.position.y += this.lightHeightOffset;
        light.castShadow = true;
        light.shadow.mapSize.width = 512; // Optimize shadow map size
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = this.lightDistance + 5; // Match light's effective range
        this.scene.add(light);
        return light;
    }

    update(playerPosition) {
        // Remove distant lights
        for (let i = this.lights.length - 1; i >= 0; i--) {
            const light = this.lights[i];
            if (light.position.distanceTo(playerPosition) > this.lightVisibilityDistance) {
                light.visible = false; 
                this.scene.remove(light);
                light.dispose(); // Dispose of the light resource
                this.lights.splice(i, 1);
            }
        }
        
        // Add new lights near the player
        const segments = this.hallwayGenerator.getVisibleSegments(playerPosition);
        for (const segment of segments) {
            if (segment.needsLight && this.lights.length < this.maxLights) {
                const light = this.createPointLight(segment.center);
                this.lights.push(light);
                segment.needsLight = false; 
            }
        }
    }

    clearAllLights() {
        this.lights.forEach(light => {
            this.scene.remove(light);
            light.dispose();
        });
        this.lights = [];
    }
}