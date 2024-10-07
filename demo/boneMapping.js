import * as THREE from 'three'
import { SkeletonHelper } from './skeletonHelper.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class BoneMappingScene {

    static VIEW = 0;
    static MAP = 1;

    static BASE_COLOR = new THREE.Color().setHex(0xffffff);
    static VIEW_COLOR = new THREE.Color().setHex(0x3E57E4);
    static EDIT_COLOR = new THREE.Color().setHex(0x7ba80a);
    static UNMAPED_COLOR = new THREE.Color().setHex(0xffff00);

    constructor(tposeBones) {
        this.scene = new THREE.Scene();
        
        //include lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        const light = new THREE.PointLight(0xffffff, 2, 0, 0);
        light.position.set(0,0.5,0.5);
        this.scene.add(light)

        this.active = false;

        this.selectedSrcBone = -1;
        this.selectedTrgBone = -1;
        this.boneMap = null;
        this.srcTPoseMap = {
       
            "ShouldersUnion": null,
            "BelowStomach":   null,
            "RArm":           null,
            "RWrist":         null,
            "LArm":           null,
            "LWrist":         null,
            "LUpLeg":         null,
            "LLeg":           null,
            "LFoot":          null,
            "RUpLeg":         null,
            "RLeg":           null,
            "RFoot":          null,
        };

        this.trgTPoseMap = {
       
            "ShouldersUnion": null,
            "BelowStomach":   null,
            "RArm":           null,
            "RWrist":         null,
            "LArm":           null,
            "LWrist":         null,
            "LUpLeg":         null,
            "LLeg":           null,
            "LFoot":          null,
            "RUpLeg":         null,
            "RLeg":           null,
            "RFoot":          null,
        }
        this.tPoseBones = [
       
            "ShouldersUnion", 
            "Stomach",  	  
            "BelowStomach",   
            "Hips",			  
            "RArm",           
            "RWrist",         
            "LArm",           
            "LWrist",         
            "LUpLeg",         
            "LLeg",           
            "LFoot",          
            "RUpLeg",         
            "RLeg",           
            "RFoot"          
        ];
        
    }

    init(root, srcSkeleton, trgSkeleton, boneMap, onSelect = null) {
        
        this.boneMap = boneMap;
        const clonedSrc = this.cloneSkeleton(srcSkeleton);
        const clonedTrg = this.cloneSkeleton(trgSkeleton);

        clonedSrc.bones[0].position.x = -0.15;
        clonedSrc.bones[0].updateMatrixWorld(true);
        this.source = new SkeletonHelper(clonedSrc.bones[0], new THREE.Color().setHex( 0x96a0cc ));
        this.source.name = "source";
        clonedTrg.bones[0].position.x = 0.15;
        clonedTrg.bones[0].updateMatrixWorld(true);
        this.target = new SkeletonHelper(clonedTrg.bones[0]);
        this.target.name = "target";
        this.scene.add(this.source);
        this.scene.add(this.target);

        for(let srcBoneName in this.boneMap) {
            if(!this.boneMap[srcBoneName]) {
                const id = findIndexOfBoneByName(this.source, srcBoneName);
                if(id < 0) {
                    return;
                }
                this.source.instancedMesh.setColorAt( id, BoneMappingScene.UNMAPED_COLOR);  
                this.source.instancedMesh.instanceColor.needsUpdate = true;
            }
        }
        
        const mappedBonesNames = Object.values(this.boneMap);
        for(let i = 0; i < this.target.bones.length; i++) {
            const trgBoneName = this.target.bones[i].name;
            if(mappedBonesNames.indexOf(trgBoneName) < 0) {            
                this.target.instancedMesh.setColorAt( i, BoneMappingScene.UNMAPED_COLOR);  
                this.target.instancedMesh.instanceColor.needsUpdate = true;
            }
        }
        // renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( root.clientWidth, root.clientHeight );

        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1;

        this.camera = new THREE.PerspectiveCamera(40, root.clientWidth/root.clientHeight, 0.01, 100);
        this.camera.position.set(0,0.1,0.8);
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(-0.050, -0.01, 0);
        this.controls.enableDamping = true; // this requires controls.update() during application update
        this.controls.dampingFactor = 0.1;
        this.controls.enabled = true;
        this.controls.update();

        this.renderer.render( this.scene,this.camera );        
        this.root = this.renderer.domElement;
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.bottom = "40px";
        this.div.style.left = "25%";
        this.div.innerText = '';
        root.append(this.div);
        root.appendChild(this.renderer.domElement);
        this.mouseX = 0;
        this.mouseY = 0;
        this.root.addEventListener( 'mousedown', this.onMouseDown.bind(this) );
        this.root.addEventListener( 'mouseup', this.onMouseUp.bind(this) );

        this.active = true;
        this.state = BoneMappingScene.VIEW;
        this.onSelect = onSelect;
    }

    cloneSkeleton(skeleton) {
        const cloned = skeleton.clone();
        let bones = [];
        let parents = [];
        let totalLenght = 0;
        for(let i = 0; i < skeleton.bones.length; i++) {
            bones.push(skeleton.bones[i].clone(false));
           
            let parentIdx = -1;
            if(i != 0) {
                bones[i].parent =  null;
                if(skeleton.bones[i].parent) {
                    parentIdx = skeleton.bones.indexOf(skeleton.bones[i].parent);
                }

            }
            parents.push(parentIdx);
        }
        //skeleton.bones[0].parent.add(bones[0]);
        for(let i = 0; i < skeleton.bones.length; i++) {
            if(parents[i] > -1) {
                bones[parents[i]].add(bones[i]);
            }
        }
        cloned.bones = bones;
        cloned.pose();
        for(let i = 1; i < cloned.bones.length; i++) {
            const dist = cloned.bones[i].getWorldPosition(new THREE.Vector3()).distanceTo(cloned.bones[i].parent.getWorldPosition(new THREE.Vector3()))
            totalLenght += dist;
        }

        let scale = 1 / totalLenght;
        const globalScale = new THREE.Vector3(0.01, 0.01, 0.01);
        skeleton.bones[0].parent.getWorldScale(globalScale);
        globalScale.multiplyScalar(scale);
        cloned.bones[0].scale.copy(globalScale);
        cloned.bones[0].position.set(0,0,0);
        cloned.bones[0].updateMatrixWorld(true);
        return cloned;
    }

    update() {
        if(this.active) {
            this.controls.update();
            this.renderer.render( this.scene,this.camera );        
        }
    }

    onMouseDown(event) {        

        this.mouseX = event.pageX;
        this.mouseY = event.pageY;       
    }

    onMouseUp(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        const diffX = Math.abs(event.pageX - this.mouseX);
        const diffY = Math.abs(event.pageY - this.mouseY);
        const delta = 6;

        if(diffX < delta && diffY < delta) {
            if(this.selectedSrcBone > -1) {
                let color = null;
                const srcBoneName = this.source.bones[this.selectedSrcBone].name;
                if(!this.boneMap[srcBoneName]) {            
                    color = BoneMappingScene.UNMAPED_COLOR;  
                }
                
                this.clearSelection(this.source.instancedMesh, this.selectedSrcBone, color);
            }
            if(this.selectedTrgBone > -1) {
                let color = null;
                const trgBoneName = this.target.bones[this.selectedTrgBone].name;
                const mappedBonesNames = Object.values(this.boneMap);
                if(mappedBonesNames.indexOf(trgBoneName) < 0) {            
                    color = BoneMappingScene.UNMAPED_COLOR;  
                }
                
                this.clearSelection(this.target.instancedMesh, this.selectedTrgBone, color);
            }
            switch(event.button) {
                case 0: // LEFT
                    this.state = BoneMappingScene.VIEW;
                    this.div.innerText = 'Mode: VIEW';
                break;
                case 2: // RIGHT
                    this.state = BoneMappingScene.EDIT;
                    this.div.innerText = 'Mode: EDIT';
                break;
            }
            this.onMouseClick(event);
        }
    }

    onMouseClick(event) {
        
        // Convert mouse position to normalized device coordinates (-1 to +1)
        let mouse = new THREE.Vector2();
        let {x ,y , width, height} = this.renderer.domElement.getBoundingClientRect();
        mouse.x = ( (event.clientX - x) / width ) * 2 - 1;
        mouse.y = - ( (event.clientY - y)/ height ) * 2 + 1;

        let source = this.source.instancedMesh;
        let target = this.target.instancedMesh;

        // Set raycaster from the camera to the mouse direction
        // Raycaster
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        // Check for intersections
        const intersects = raycaster.intersectObjects([source, target]);

        // If there is an intersection, log it or perform some action
        if (intersects.length > 0) {
            const bones = intersects[0].object.parent.bones;
            const bone = bones[intersects[0].instanceId];

            let selectColor = new THREE.Color();
            
            if(this.state == BoneMappingScene.VIEW) {
                selectColor = BoneMappingScene.VIEW_COLOR;
            }
            else if(this.state == BoneMappingScene.EDIT) {
                selectColor = BoneMappingScene.EDIT_COLOR;;
            }

            // Source selected
            if(intersects[0].object == source) {
                
                // Select source bone
                this.selectedSrcBone = intersects[0].instanceId;                
                if(this.state == BoneMappingScene.VIEW ) {
                    // Select target bone only in view mode
                    this.selectedTrgBone = findIndexOfBoneByName(target.parent, this.boneMap[bone.name]);
                }
                else {
                    // Update bone mapping in edit mode and return to view mode
                    const srcName = Object.keys(this.boneMap).find(key => this.boneMap[key] === target.parent.bones[this.selectedTrgBone].name);
                    this.boneMap[srcName] = null;
                    this.boneMap[bone.name] = target.parent.bones[this.selectedTrgBone].name;
                    this.state = BoneMappingScene.VIEW;
                }

                target.setColorAt( this.selectedTrgBone, selectColor);
                target.instanceColor.needsUpdate = true;

                if(this.onSelect) {
                    this.onSelect(bone, this.selectedSrcBone);
                }
                
            } // Target selected
            else if(intersects[0].object == target) {
                                  
                // Select target bone
                this.selectedTrgBone = intersects[0].instanceId;

                if(this.state == BoneMappingScene.VIEW ) {
                    // Select target bone only in view mode
                    const srcName = Object.keys(this.boneMap).find(key => this.boneMap[key] === bone.name);
                    this.selectedSrcBone = findIndexOfBoneByName(source.parent, srcName);     
                }
                else {
                    const srcName = Object.keys(this.boneMap).find(key => this.boneMap[key] === bone.name);
                    this.boneMap[srcName] = null;
                    // Update bone mapping in edit mode and return to view mode
                    this.boneMap[source.parent.bones[this.selectedSrcBone].name] = bone.name;
                    this.state = BoneMappingScene.VIEW;
                }
                source.setColorAt( this.selectedSrcBone, selectColor);                            
                source.instanceColor.needsUpdate = true;
                if(this.onSelect) {
                    this.onSelect(source.parent.bones[this.selectedSrcBone], this.selectedTrgBone);
                }
            }

            intersects[0].object.setColorAt( intersects[0].instanceId, selectColor);        
            intersects[0].object.instanceColor.needsUpdate = true;
        }
    }

    clearSelection(mesh, boneIdx, color) {
        mesh.setColorAt( boneIdx, color || mesh.parent.color || BoneMappingScene.BASE_COLOR );
    }

    onUpdateFromGUI(sourceBoneName) {
        let target = this.target.instancedMesh;
        let baseTrgColor = this.target.parent.color || BoneMappingScene.BASE_COLOR;

        if(this.selectedTrgBone) {
            target.setColorAt( this.selectedTrgBone, baseTrgColor);
        }
        // Select target bone
        this.selectedTrgBone = findIndexOfBoneByName(target.parent, this.boneMap[sourceBoneName]);
        
        target.setColorAt( this.selectedTrgBone, BoneMappingScene.VIEW_COLOR );
        target.instanceColor.needsUpdate = true;

    }
    dispose() {
        this.active = false;
        if(this.source) {
            this.scene.remove(this.source);
        }
        if(this.target) {
            this.scene.remove(this.target);
        }
        if(this.renderer) {
            this.renderer.dispose();
        }
    }
}

function findIndexOfBoneByName( skeleton, name ){
    if ( !name ){ return -1; }
    let b = skeleton.bones;
    for( let i = 0; i < b.length; ++i ){
        if ( b[i].name == name ){ return i; }
    }
    return -1;
}
export default BoneMappingScene;