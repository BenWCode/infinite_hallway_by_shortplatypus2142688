import * as THREE from 'three';

export class WallObjectGenerator {
    constructor(config) {
        this.hallwayWidth = config.hallwayWidth;
        this.hallwayHeight = config.hallwayHeight;
        // segmentLength is passed in segmentData during generate, 
        // or can be stored if all segments have uniform length from this generator's perspective.
        // For now, we'll use segmentData.segmentLength.

        this.textureLoader = new THREE.TextureLoader();
        
        this.wallTexture = this.textureLoader.load(config.wallTexturePath || 'wall.png');
        this.floorTexture = this.textureLoader.load(config.floorTexturePath || 'floor.png');
        this.ceilingTexture = this.textureLoader.load(config.ceilingTexturePath || 'ceiling.png');
        
        const repeatVal = 1; // How many times texture repeats per segment face
        this.wallTexture.wrapS = this.wallTexture.wrapT = THREE.RepeatWrapping;
        this.floorTexture.wrapS = this.floorTexture.wrapT = THREE.RepeatWrapping;
        this.ceilingTexture.wrapS = this.ceilingTexture.wrapT = THREE.RepeatWrapping;
        
        this.wallTexture.repeat.set(repeatVal, repeatVal);
        this.floorTexture.repeat.set(repeatVal, repeatVal);
        this.ceilingTexture.repeat.set(repeatVal, repeatVal);
        
        this.wallMaterial = new THREE.MeshStandardMaterial({ 
            map: this.wallTexture,
            roughness: 0.8,
            side: THREE.FrontSide // Standard for closed environments
        });
        
        this.floorMaterial = new THREE.MeshStandardMaterial({ 
            map: this.floorTexture,
            roughness: 0.9
        });
        
        this.ceilingMaterial = new THREE.MeshStandardMaterial({ 
            map: this.ceilingTexture,
            roughness: 0.7
        });
    }

    generate(segmentGroup, segmentData) {
        // segmentData contains: start, end, direction, center, segmentLength, hallwayWidth, hallwayHeight

        const segmentLength = segmentData.segmentLength;

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(this.hallwayWidth, segmentLength);
        const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        segmentGroup.add(floor);
        
        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(this.hallwayWidth, segmentLength);
        const ceiling = new THREE.Mesh(ceilingGeometry, this.ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.hallwayHeight;
        ceiling.receiveShadow = true;
        segmentGroup.add(ceiling);
        
        // Left wall
        const leftWallGeometry = new THREE.PlaneGeometry(segmentLength, this.hallwayHeight);
        const leftWall = new THREE.Mesh(leftWallGeometry, this.wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.x = -this.hallwayWidth / 2;
        leftWall.position.y = this.hallwayHeight / 2;
        leftWall.receiveShadow = true;
        leftWall.castShadow = true; 
        segmentGroup.add(leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.PlaneGeometry(segmentLength, this.hallwayHeight);
        const rightWall = new THREE.Mesh(rightWallGeometry, this.wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.x = this.hallwayWidth / 2;
        rightWall.position.y = this.hallwayHeight / 2;
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        segmentGroup.add(rightWall);
    }
}