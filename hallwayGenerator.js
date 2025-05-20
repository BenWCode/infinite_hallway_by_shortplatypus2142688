import * as THREE from 'three';

let genFactor = 6;

export class HallwayGenerator {
    constructor(scene, maxSegments = 5) {
        this.scene = scene;
        this.maxSegments = maxSegments;
        this.segments = [];
        this.segmentLength = 5;
        this.hallwayWidth = 3;
        this.hallwayHeight = 3;
        this.minTurnSegments = 5; // Minimum segments before a turn
        this.maxTurnSegments = 10; // Maximum segments before a turn
        this.segmentsSinceTurn = 0;
        this.segmentsUntilNextTurn = this.getRandomTurnInterval();
        this.currentDirection = new THREE.Vector3(0, 0, -1); // Initial direction (Z-axis)
        this.textureLoader = new THREE.TextureLoader();
        
        // Load textures
        this.wallTexture = this.textureLoader.load('wall.png');
        this.floorTexture = this.textureLoader.load('floor.png');
        this.ceilingTexture = this.textureLoader.load('ceiling.png');
        
        // Repeat textures
        this.wallTexture.wrapS = this.wallTexture.wrapT = THREE.RepeatWrapping;
        this.floorTexture.wrapS = this.floorTexture.wrapT = THREE.RepeatWrapping;
        this.ceilingTexture.wrapS = this.ceilingTexture.wrapT = THREE.RepeatWrapping;
        
        this.wallTexture.repeat.set(1, 1);
        this.floorTexture.repeat.set(1, 1);
        this.ceilingTexture.repeat.set(1, 1);
        
        // Materials
        this.wallMaterial = new THREE.MeshStandardMaterial({ 
            map: this.wallTexture,
            roughness: 0.8
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

    initialize() {
        // Generate initial hallway segments
        const startPosition = new THREE.Vector3(0, 0, 0);
        for (let i = 0; i < this.maxSegments; i++) {
            this.generateNextSegment();
        }
    }

    generateNextSegment() {
        let position, direction;
        
        if (this.segments.length === 0) {
            // First segment starts at origin
            position = new THREE.Vector3(0, 0, 0);
            direction = new THREE.Vector3(0, 0, -1); // Initial direction
        } else {
            // Get last segment's end position
            const lastSegment = this.segments[this.segments.length - 1];
            position = lastSegment.end.clone();
            direction = this.currentDirection.clone();
            
            // Check if we need to turn
            this.segmentsSinceTurn++;
            if (this.segmentsSinceTurn >= this.segmentsUntilNextTurn) {
                // Time to make a turn
                const turnAngle = (Math.random() * Math.PI / 2) - Math.PI / 4; // Random angle between -45 and 45 degrees
                
                // Create a rotation matrix around the Y-axis
                const rotationMatrix = new THREE.Matrix4().makeRotationY(turnAngle);
                direction.applyMatrix4(rotationMatrix);
                
                // Update current direction
                this.currentDirection = direction.clone();
                
                // Reset turn counter
                this.segmentsSinceTurn = 0;
                this.segmentsUntilNextTurn = this.getRandomTurnInterval();
            }
        }
        
        // Calculate end position based on direction and segment length
        const end = position.clone().add(direction.clone().multiplyScalar(this.segmentLength));
        
        // Create hallway segment
        const segment = this.createHallwaySegment(position, end, direction);
        this.segments.push(segment);
        
        // hide old segments if we exceed max segments
        if (this.segments.length > this.maxSegments) {
           const oldestSegment = this.segments[0];
           this.hideSegment(oldestSegment);
        }
        
        return segment;
    }
    
    getRandomTurnInterval() {
        return Math.floor(Math.random() * (this.maxTurnSegments - this.minTurnSegments + 1)) + this.minTurnSegments;
    }

    createHallwaySegment(start, end, direction) {
        // Calculate the center of the segment
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        
        // Create a group for the segment
        const segmentGroup = new THREE.Group();
        
        // Create a quaternion to rotate the hallway piece to align with the direction
        const quaternion = new THREE.Quaternion();
        const initDirection = new THREE.Vector3(0, 0, 1); // Default forward direction
        quaternion.setFromUnitVectors(initDirection, direction.clone().normalize().negate());
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(this.hallwayWidth, this.segmentLength);
        const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        segmentGroup.add(floor);
        
        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(this.hallwayWidth, this.segmentLength);
        const ceiling = new THREE.Mesh(ceilingGeometry, this.ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.hallwayHeight;
        ceiling.receiveShadow = true;
        segmentGroup.add(ceiling);
        
        // Left wall
        const leftWallGeometry = new THREE.PlaneGeometry(this.segmentLength, this.hallwayHeight);
        const leftWall = new THREE.Mesh(leftWallGeometry, this.wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.x = -this.hallwayWidth / 2;
        leftWall.position.y = this.hallwayHeight / 2;
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        segmentGroup.add(leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.PlaneGeometry(this.segmentLength, this.hallwayHeight);
        const rightWall = new THREE.Mesh(rightWallGeometry, this.wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.x = this.hallwayWidth / 2;
        rightWall.position.y = this.hallwayHeight / 2;
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        segmentGroup.add(rightWall);
        
        // Rotate the entire segment to align with the direction
        segmentGroup.quaternion.copy(quaternion);
        
        // Position the segment at the center
        segmentGroup.position.copy(center);
        
        // Add to scene
        this.scene.add(segmentGroup);
        
        // Return segment data
        return {
            start,
            end,
            center,
            direction: direction.clone(),
            group: segmentGroup,
            needsLight: true // Flag to indicate this segment needs a light
        };
    }

    hideSegment(segment) {
        // Remove segment from scene
        segment.group.visible = false;
        segment.hidden = true;
    }

    showSegment(segment) {
        // Remove segment from scene
        segment.group.visible = true;
        segment.hidden = false;
    }

    getVisibleSegments(playerPosition) {
        // Return segments that are within a certain distance of the player
        const visibleDistance = 30;
        return this.segments.filter(segment => 
            segment.center.distanceTo(playerPosition) < visibleDistance
        );
    }

    update(playerPosition) {
        // Check if we need to generate more segments
        const lastSegment = this.segments[this.segments.length - 1];
        const distanceToEnd = playerPosition.distanceTo(lastSegment.end);
        
        // If player is getting close to the end of the hallway, generate more segments
        if (distanceToEnd < this.segmentLength * genFactor) {
            this.generateNextSegment();
        }
        
        // Remove segments that are far behind the player

    }
    

}


