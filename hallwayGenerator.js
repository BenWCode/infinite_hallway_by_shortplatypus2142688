import * as THREE from 'three';

export class HallwayGenerator {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.maxSegmentsInMemory = config.maxSegmentsInMemory || 50; 
        this.segments = [];
        this.segmentLength = config.segmentLength || 5;
        this.hallwayWidth = config.hallwayWidth || 3; 
        this.hallwayHeight = config.hallwayHeight || 3; 
        
        this.minTurnSegments = config.minTurnSegments || 5;
        this.maxTurnSegments = config.maxTurnSegments || 10;
        this.segmentsSinceTurn = 0;
        this.segmentsUntilNextTurn = this.getRandomTurnInterval();
        this.currentDirection = new THREE.Vector3(0, 0, -1);
        this.initialPosition = config.initialPosition || new THREE.Vector3(0, 0, 0);

        this.objectGenerators = [];
        this.generationTriggerDistance = (config.generationTriggerFactor || 4) * this.segmentLength; 
        this.visibleDistance = config.visibleDistance || 100; 
    }

    addObjectGenerator(generator) {
        this.objectGenerators.push(generator);
    }

    initialize() {
        const initialSegmentsToGenerate = Math.ceil(this.visibleDistance / this.segmentLength) + Math.ceil(this.generationTriggerDistance / this.segmentLength) + 2;
        for (let i = 0; i < initialSegmentsToGenerate; i++) {
            this.generateNextSegment();
        }
    }

    getRandomTurnInterval() {
        return Math.floor(Math.random() * (this.maxTurnSegments - this.minTurnSegments + 1)) + this.minTurnSegments;
    }

    generateNextSegment() {
        let position;
        
        if (this.segments.length === 0) {
            position = this.initialPosition.clone();
        } else {
            const lastSegment = this.segments[this.segments.length - 1];
            position = lastSegment.end.clone();
            
            this.segmentsSinceTurn++;
            if (this.segmentsSinceTurn >= this.segmentsUntilNextTurn) {
                const turnAngle = (Math.random() * Math.PI / 2) - Math.PI / 4; // Random angle between -45 and 45 degrees

                
                const rotationMatrix = new THREE.Matrix4().makeRotationY(turnAngle);
                this.currentDirection.applyMatrix4(rotationMatrix).normalize();
                
                this.segmentsSinceTurn = 0;
                this.segmentsUntilNextTurn = this.getRandomTurnInterval();
            }
        }
        
        const end = position.clone().add(this.currentDirection.clone().multiplyScalar(this.segmentLength));
        const segment = this.createHallwaySegment(position, end, this.currentDirection.clone());
        this.segments.push(segment);
        
        if (this.segments.length > this.maxSegmentsInMemory) {
           const oldestSegment = this.segments.shift(); 
           this.disposeSegment(oldestSegment);
        }
        
        return segment;
    }

    createHallwaySegment(start, end, direction) {
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const segmentGroup = new THREE.Group();
        
        const quaternion = new THREE.Quaternion();
        const referenceDirection = new THREE.Vector3(0, 0, 1); 
        quaternion.setFromUnitVectors(referenceDirection, direction.clone().normalize().negate());
        
        segmentGroup.quaternion.copy(quaternion);
        segmentGroup.position.copy(center);
        
        const segmentData = {
            start,
            end,
            center,
            direction,
            group: segmentGroup,
            segmentLength: this.segmentLength,
            hallwayWidth: this.hallwayWidth,
            hallwayHeight: this.hallwayHeight,
            needsLight: true 
        };

        this.objectGenerators.forEach(generator => {
            generator.generate(segmentGroup, segmentData);
        });
        
        this.scene.add(segmentGroup);
        
        return segmentData;
    }

    disposeSegment(segment) {
        segment.group.traverse((object) => {
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                // Materials are shared by WallObjectGenerator, so they are not disposed here.
            }
        });
        this.scene.remove(segment.group);
    }

    getVisibleSegments(playerPosition) {
        return this.segments.filter(segment => 
            segment.center.distanceTo(playerPosition) < this.visibleDistance
        );
    }

    update(playerPosition) {
        const lastSegment = this.segments[this.segments.length - 1];
        if (!lastSegment) return; 

        const distanceToEnd = playerPosition.distanceTo(lastSegment.end);
        
        if (distanceToEnd < this.generationTriggerDistance) {
            this.generateNextSegment();
        }
    }
}