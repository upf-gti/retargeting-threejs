import * as THREE from 'three'
import { applyTPose } from './retargeting.js';

// O(nm)
function findIndexOfBoneByName( skeleton, name ){
    if ( !name ){ return -1; }
    let b = skeleton.bones;
    for( let i = 0; i < b.length; ++i ){
        if ( b[i].name.replace( "mixamorig_", "" ).replace("mixamorig:", "").replace( "mixamorig", "" ) == name ){ return i; }
    }
    return -1;
}

// O(n)
function findIndexOfBone( skeleton, bone ){
    if ( !bone ){ return -1;}
    let b = skeleton.bones;
    for( let i = 0; i < b.length; ++i ){
        if ( b[i] == bone ){ return i; }
    }
    return -1;
}

const CURRENT = 1;
const EPSILON = (0.01 * Math.PI / 180);
const FORWARD = new THREE.Vector3(0,0,1);
const UP =  new THREE.Vector3(0,1,0);
const DOWN = new THREE.Vector3(0,-1,0);
const BACK = new THREE.Vector3(0,0,-1);
const LEFT = new THREE.Vector3(1,0,0);
const RIGHT =  new THREE.Vector3(-1,0,0);

class IKRig {
    static ARM_MIXAMO = 1;

    constructor() {
        this.skeleton = null; // reference back to armature component
        this.tpose = null; // TPose (better for IK) or Bind Pose 
        this.pose = null; // Pose to manipulate before applying to bone entities
        this.chains = {}; // Bone chains: limbs, spine, hair, tail...
        this.points = {}; // Main single bones of the Rig: head, hip, chest...

        this.leg_len_lmt = 0;
        this.ikSolver = null;
    }

    applyPose(){ 
        this.pose.apply(); 
    }
	
    updateWorld(){ 
        this.pose.updateWorld(); 
    }

    init(tpose, pose, type = IKRig.ARM_MIXAMO) {
        this.skeleton = this.pose = pose;
        this.tpose = tpose;
        this.pose = this.skeleton;
        switch( type ){
			case IKRig.ARM_MIXAMO : this.initMixamoRig( this.skeleton, this ); break;
		}
		return this;
    }


    addPoint(name, boneName) {
        this.points[ name ] = {
            idx: findIndexOfBoneByName( this.skeleton, boneName )
        }
        return this;
    }

    addChain(name, arrayNames, endEffectorName = null, multi = false, constraints = [], ikSolver = null) {

        let bones = [];
        let bonesInfo = [];
        let totalLength = 0;
        for(let i = 0; i < arrayNames.length; i ++) {
            const idx = findIndexOfBoneByName(this.tpose, arrayNames[i]);
            let len = 0;
            if(i > 0) {
                
                let parentPos = this.tpose.bones[bonesInfo[i-1].idx].getWorldPosition(new THREE.Vector3());
                let pos = this.tpose.bones[idx].getWorldPosition(new THREE.Vector3());
        
                if(this.tpose.transformsWorldEmbedded) {
                    let cmat = new THREE.Matrix4().compose(this.tpose.transformsWorldEmbedded.forward.p, this.tpose.transformsWorldEmbedded.forward.q, this.tpose.transformsWorldEmbedded.forward.s);
                    let mat = this.tpose.bones[bonesInfo[i-1].idx].matrixWorld.clone();
                    mat.premultiply(cmat);
                    mat.decompose(parentPos, new THREE.Quaternion(), new THREE.Vector3());

                    mat = this.tpose.bones[idx].matrixWorld.clone();
                    mat.premultiply(cmat);
                    mat.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
                }
                len = parentPos.distanceTo(pos);
                totalLength += len;
                bonesInfo[i-1].len = len;
            }
            bonesInfo.push({idx, len:0});
            bones.push(idx);
        }

        let endEffector = bones[bones.length-1];
        let targetPos = this.tpose.bones[endEffector].getWorldPosition(new THREE.Vector3());
        if(endEffectorName) {
            endEffector = findIndexOfBoneByName(this.tpose, endEffectorName);
            if(endEffector > -1) {
                const parentPos = this.tpose.bones[bonesInfo[bonesInfo.length-1].idx].getWorldPosition(new THREE.Vector3());
                targetPos = this.tpose.bones[endEffector].getWorldPosition(new THREE.Vector3());
                if(this.tpose.transformsWorldEmbedded) {
                    let cmat = new THREE.Matrix4().compose(this.tpose.transformsWorldEmbedded.forward.p, this.tpose.transformsWorldEmbedded.forward.q, this.tpose.transformsWorldEmbedded.forward.s);
                    let mat = this.tpose.bones[bonesInfo[bonesInfo.length-1].idx].matrixWorld.clone();
                    mat.premultiply(cmat);
                    mat.decompose(parentPos, new THREE.Quaternion(), new THREE.Vector3());

                    mat = this.tpose.bones[endEffector].matrixWorld.clone();
                    mat.premultiply(cmat);
                    mat.decompose(targetPos, new THREE.Quaternion(), new THREE.Vector3());
                }
                const len = parentPos.distanceTo(targetPos);
                bonesInfo[bonesInfo.length-1].len = len;
                bonesInfo.push({idx: endEffector, len: 0});
                bones.push(endEffector);
                totalLength += len;
            }
        }

        const target = new THREE.Object3D();
        target.position.copy(targetPos);

        this.chains[ name ] =  {
            name: name,
            bones: bonesInfo, 
            constraints: constraints,
            target: target,
            alt_forward: FORWARD.clone(),
            alt_up: UP.clone(),
            length: totalLength
        }

        // IK SOLVER:
        // if ( !character.FABRIKSolver ){ character.FABRIKSolver = new FABRIKSolver( character.skeleton ); }
        if(ikSolver) {
            ikSolver.createChain(bones.reverse(), this.chains[ name ].constraints, this.chains[ name ].target, this.chains[ name ].name);
        }else {
            this.chains[ name ].ikSolver = new IKSolver(this.tpose, this.chains[ name ], multi);
        }
        //this.addChain(character, {name:name, origin: bones[0], endEffector }, null, new THREE.Vector3(1,1,0));
    }

    setAlternatives(chainName, forward, up, tpose = null) {
        let f = forward.clone();
        let u = up.clone();
        if( tpose ){
			let bone = tpose.bones[ this.chains[chainName].bones[ 0 ].idx ];
            let q = bone.getWorldQuaternion(new THREE.Quaternion());
            
            if(tpose.transformsWorldEmbedded) {
                q.premultiply(tpose.transformsWorldEmbedded.forward.q)
            }
            q.invert();	// Invert World Space Rotation 

			this.chains[chainName].alt_forward = f.applyQuaternion(q);	// Use invert to get direction that will Recreate the real direction
			this.chains[chainName].alt_up = u.applyQuaternion(q);	
		}else{
			this.chains[chainName].alt_forward.copy( f );
			this.chains[chainName].alt_up.copy( u );
		}
		return this;
    }

    initMixamoRig( skeleton, rig ){
        
        rig.addPoint( "hip", "Hips" )
        rig.addPoint( "head", "Head" )
        rig.addPoint( "neck", "Neck" )
        rig.addPoint( "chest", "Spine2" )
        rig.addPoint( "foot_l", "LeftFoot" )
        rig.addPoint( "foot_r", "RightFoot" )
    
        rig.addChain( "arm_r", [ "RightArm", "RightForeArm" ],  "RightHand")
        rig.addChain( "arm_l", [ "LeftArm", "LeftForeArm" ], "LeftHand") 
    
        rig.addPoint( "hand_r", "RightHand");
        rig.addPoint( "hand_l", "LeftHand");

        rig.addChain( "leg_r", [ "RightUpLeg", "RightLeg" ], "RightFoot")
        rig.addChain( "leg_l", [ "LeftUpLeg", "LeftLeg" ], "LeftFoot")
    
        rig.addChain( "spine", [ "Spine", "Spine1", "Spine2" ] ) //, "y"
        
        rig.addChain( "thumb_r", [ "RightHandThumb1", "RightHandThumb2", "RightHandThumb3" ], "RightHandThumb4", true ) //, "y"
        rig.addChain( "index_r", [ "RightHandIndex1", "RightHandIndex2", "RightHandIndex3" ], "RightHandIndex4", true ) //, "y"
        rig.addChain( "middle_r", [ "RightHandMiddle1", "RightHandMiddle2", "RightHandMiddle3" ], "RightHandMiddle4", true ) //, "y"
        rig.addChain( "ring_r", [ "RightHandRing1", "RightHandRing2", "RightHandRing3" ], "RightHandRing4", true ) //, "y"
        rig.addChain( "pinky_r", [ "RightHandPinky1", "RightHandPinky2", "RightHandPinky3" ], "RightHandPinky4", true ) //, "y"
        
        rig.addChain( "thumb_l", [ "LeftHandThumb1", "LeftHandThumb2", "LeftHandThumb3" ], "LeftHandThumb4", true ) //, "y"
        rig.addChain( "index_l", [ "LeftHandIndex1", "LeftHandIndex2", "LeftHandIndex3" ], "LeftHandIndex4", true ) //, "y"
        rig.addChain( "middle_l", [ "LeftHandMiddle1", "LeftHandMiddle2", "LeftHandMiddle3" ], "LeftHandMiddle4", true ) //, "y"
        rig.addChain( "ring_l", [ "LeftHandRing1", "LeftHandRing2", "LeftHandRing3" ], "LeftHandRing4", true ) //, "y"
        rig.addChain( "pinky_l", [ "LeftHandPinky1", "LeftHandPinky2", "LeftHandPinky3" ], "LeftHandPinky4", true ) //, "y"
        
    
        // Set Direction of Joints on th Limbs   
        rig.setAlternatives( "leg_l", DOWN, FORWARD, rig.tpose );
        rig.setAlternatives( "leg_r", DOWN, FORWARD, rig.tpose );
        rig.setAlternatives( "arm_l", LEFT, BACK, rig.tpose );
        rig.setAlternatives( "arm_r", RIGHT, BACK, rig.tpose );
        rig.setAlternatives( "thumb_r", RIGHT, FORWARD, rig.tpose );
        rig.setAlternatives( "index_r", RIGHT, UP, rig.tpose );
        rig.setAlternatives( "middle_r", RIGHT, UP, rig.tpose );
        rig.setAlternatives( "ring_r", RIGHT, UP, rig.tpose );
        rig.setAlternatives( "pinky_r", RIGHT, UP, rig.tpose );
        rig.setAlternatives( "thumb_l", LEFT, UP, rig.tpose );
        rig.setAlternatives( "index_l", LEFT, UP, rig.tpose );
        rig.setAlternatives( "middle_l", LEFT, UP, rig.tpose );
        rig.setAlternatives( "ring_l", LEFT, UP, rig.tpose );
        rig.setAlternatives( "pinky_l", LEFT, UP, rig.tpose );
    }

    /**
     * creates a Transform object with identity values
     * @returns Transform
     */
    _newTransform(){ return { p: new THREE.Vector3(0,0,0), q: new THREE.Quaternion(0,0,0,1), s: new THREE.Vector3(1,1,1) }; }

    /**
     * Deep clone of the skeleton. New bones are generated. Skeleton's parent objects will not be linked to the cloned one
     * Returned skeleton has new attributes: 
     *  - Always: .parentIndices, .transformsWorld, .transformsWorldInverses
     *  - embedWorld == true:  .transformsWorldEmbedded
     * @param {THREE.Skeleton} skeleton 
     * @returns {THREE.Skeleton}
     */
    cloneRawSkeleton( skeleton, poseMode, embedWorld = false ){
        let bones = skeleton.bones;
       
        let resultBones = new Array( bones.length );
        let parentIndices = new Int16Array( bones.length );

        // bones[0].clone( true ); // recursive
        for( let i = 0; i < bones.length; ++i ){
            resultBones[i] = bones[i].clone(false);
            resultBones[i].parent = null;
        }
        
        for( let i = 0; i < bones.length; ++i ){
            let parentIdx = findIndexOfBone( skeleton, bones[i].parent )
            if ( parentIdx > -1 ){ resultBones[ parentIdx ].add( resultBones[ i ] ); }
            
            parentIndices[i] = parentIdx;
        }

        resultBones[0].updateWorldMatrix( false, true ); // assume 0 is root. Update all global matrices (root does not have any parent)
        
        // generate skeleton
        let resultSkeleton;
        switch(poseMode) {
            case CURRENT: 
                resultSkeleton = new THREE.Skeleton( resultBones ); // will automatically compute the inverses from the matrixWorld of each bone               
                
                break;
            default:
                let boneInverses = new Array( skeleton.boneInverses.length );
                for( let i = 0; i < boneInverses.length; ++i ) { 
                    boneInverses[i] = skeleton.boneInverses[i].clone(); 
                }
                resultSkeleton = new THREE.Skeleton( resultBones, boneInverses );
                resultSkeleton.pose();
                break;
        }
        
        resultSkeleton.parentIndices = parentIndices; // add this attribute to the THREE.Skeleton class

        // precompute transforms (forward and inverse) from world matrices
        let transforms = new Array( skeleton.bones.length );
        let transformsInverses = new Array( skeleton.bones.length );
        for( let i = 0; i < transforms.length; ++i ){
            let t = this._newTransform();
            resultSkeleton.bones[i].matrixWorld.decompose( t.p, t.q, t.s );
            transforms[i] = t;
            
            t = this._newTransform();
            resultSkeleton.boneInverses[i].decompose( t.p, t.q, t.s );
            transformsInverses[i] = t;
        }
        resultSkeleton.transformsWorld = transforms;
        resultSkeleton.transformsWorldInverses = transformsInverses;

        // embedded transform
        if ( embedWorld && bones[0].parent ){
            let embedded = { forward: this._newTransform(), inverse: this._newTransform() };
            let t = embedded.forward;
            bones[0].parent.updateWorldMatrix( true, false );
            bones[0].parent.matrixWorld.decompose( t.p, t.q, t.s );
            t = embedded.inverse;
            skeleton.bones[0].parent.matrixWorld.clone().invert().decompose( t.p, t.q, t.s );
            resultSkeleton.transformsWorldEmbedded = embedded;
        }
        return resultSkeleton;
    }
}

class IKPose {
    constructor() {
        this.hip = {
            bindHeight: 0, // Use to Scale movement
            movement: new THREE.Vector3(), // How much movement the Hip did in world space
            direction: new THREE.Vector3(), // Swing
            twist: 0 //Twist
        }

        // lengthScale: scaled lenght to the end effector, plus the direction that the knee or elbow is pointing
        // direction: for IK, is FORWARD (direction of the root to the end)
        // jointDirection: for IK, is UP (direction of the limb (knee or elbow))
        this.leftLeg =  {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}
        this.rightLeg = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}
        this.leftArm =  {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3(), childDirection: new THREE.Vector3(), childJointDirection: new THREE.Vector3()}
        this.rightArm = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3(), childDirection: new THREE.Vector3(), childJointDirection: new THREE.Vector3()}    
       
        this.rightThumb = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.rightIndex = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.rightMiddle = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.rightRing = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.rightPinky = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        
        this.leftThumb = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.leftIndex = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.leftMiddle = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.leftRing = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        this.leftPinky = {lengthScale: 0, direction: new THREE.Vector3(), jointDirection: new THREE.Vector3()}    
        
        this.leftFoot = {look: new THREE.Vector3(), twist: new THREE.Vector3()};
        this.rightFoot = {look: new THREE.Vector3(), twist: new THREE.Vector3()};
        this.leftHand = {look: new THREE.Vector3(), twist: new THREE.Vector3()};
        this.rightHand = {look: new THREE.Vector3(), twist: new THREE.Vector3()};

        this.spine = [ 
            { look: new THREE.Vector3(), twist: new THREE.Vector3()}, // First control point of rotation
            { look: new THREE.Vector3(), twist: new THREE.Vector3()}, // Second control point of rotation
            { look: new THREE.Vector3(), twist: new THREE.Vector3()} 
        ];

        this.neck = {look: new THREE.Vector3(), twist: new THREE.Vector3()};
        this.head = {look: new THREE.Vector3(), twist: new THREE.Vector3()};

    }

    applyRig( rig, pose ) {
        // this.applyHip(rig);
        
        // // Legs
        // this.applyLimb(rig, rig.chains.leg_l, this.leftLeg, 0);
        // this.applyLimb(rig, rig.chains.leg_r, this.rightLeg, 0);
        // //Feet
        // this.applyLookTwist( rig, rig.points.foot_l, this.leftFoot, FORWARD, UP );
        // this.applyLookTwist( rig, rig.points.foot_r, this.rightFoot, FORWARD, UP );
        // // Spine
        // this.applySpine(rig, rig.chains.spine, this.spine, UP, FORWARD);
        // Arms
        this.applyLimb(rig, rig.chains.arm_l, this.leftArm);
        this.applyLimb(rig, rig.chains.arm_r, this.rightArm);
        this.applyLookTwist( rig, rig.points.hand_l, this.leftHand, LEFT, BACK );
        this.applyLookTwist( rig, rig.points.hand_r, this.rightHand, RIGHT, BACK );
        // // Fingers
        // this.applyLimb(rig, rig.chains.thumb_r, this.rightThumb);
        // this.applyLimb(rig, rig.chains.index_r, this.rightIndex);
        // this.applyLimb(rig, rig.chains.middle_r, this.rightMiddle);
        // this.applyLimb(rig, rig.chains.ring_r, this.rightRing);
        // this.applyLimb(rig, rig.chains.pinky_r, this.rightPinky);

        // this.applyLimb(rig, rig.chains.thumb_l, this.leftThumb);
        // this.applyLimb(rig, rig.chains.index_l, this.leftIndex);
        // this.applyLimb(rig, rig.chains.middle_l, this.leftMiddle);
        // this.applyLimb(rig, rig.chains.ring_l, this.leftRing);
        // this.applyLimb(rig, rig.chains.pinky_l, this.leftPinky);

        // this.applyLookTwist( rig, rig.points.neck, this.neck, FORWARD, UP );
        // this.applyLookTwist( rig, rig.points.head, this.head, FORWARD, UP );
    }

    applyHip(rig) {
 
        const boneInfo = rig.points.hip;
        const bind = rig.tpose.bones[boneInfo.idx]; // Hips in bind pose
        const pose = rig.pose.bones[boneInfo.idx]; // Hips in current pose

        // ROTATION
        // Apply IK swing and twist
        let pWorldRotation = pose.parent.getWorldQuaternion(new THREE.Quaternion());
        if(rig.pose.transformsWorldEmbedded) { 
            pWorldRotation.premultiply(rig.pose.transformsWorldEmbedded.q);
        }

        let boneRotation = new THREE.Quaternion().multiplyQuaternions(pWorldRotation, bind.quaternion); // Apply WS current rotation to LS bind rotation to get it in WS
        let swing = new THREE.Quaternion().setFromUnitVectors(FORWARD, this.hip.direction); // Create swing rotation
        swing.multiply(boneRotation); // Apply swing to new WS bind rotation

        if(this.hip.twist != 0) {
            // If there's a twist angle, apply that rotation
            const q = new THREE.Quaternion().setFromAxisAngle(this.hip.direction, this.hip.twist);
            swing.premultiply(q);
        }
        swing.premultiply(pWorldRotation.invert()); // Convert the new WS bind rotation to LS multiplying the inverse rotation of the parent
        pose.quaternion.copy(swing);

        // TRANSLATION
        let bWorldPosition = bind.getWorldPosition(new THREE.Vector3());
        if(rig.tpose.transformsWorldEmbedded) {
            let mat = bind.matrixWorld.clone();
            let cmat = new THREE.Matrix4().compose(rig.tpose.transformsWorldEmbedded.forward.p, rig.tpose.transformsWorldEmbedded.forward.q, rig.tpose.transformsWorldEmbedded.forward.s);
            mat.premultiply(cmat);
            mat.decompose(bWorldPosition, new THREE.Quaternion(), new THREE.Vector3());
        }
        const hipScale = bWorldPosition.y/this.hip.bindHeight; // Scale value from source's hip height and target's hip height
        let pos = new THREE.Vector3().copy(this.hip.movement).multiplyScalar(hipScale); // Scale the translation difference to mathc this model's scale
        pos.add(bWorldPosition); // Add that scaled different to the bind pose position

        pose.position.copy(pos);
    }

    applyLimb(rig, chain, limb, grounding = 0) {
        const chainBones = chain.bones;
        const rootBone = rig.pose.bones[chainBones[0].idx];
        let rootWorldPos = rootBone.getWorldPosition(new THREE.Vector3());

        if(rig.pose.transformsWorldEmbedded) {
            let mat = rig.pose.bones[chainBones[0].idx].matrixWorld.clone();
            let cmat = new THREE.Matrix4().compose(rig.pose.transformsWorldEmbedded.forward.p, rig.pose.transformsWorldEmbedded.forward.q, rig.pose.transformsWorldEmbedded.forward.s);
            mat.premultiply(cmat);
            mat.decompose(rootWorldPos, new THREE.Quaternion(), new THREE.Vector3());
        }

        // leg_len_lmt: limit the extension of the chain (sometimes it's never full extended)
        // How much of the chain length to use to compute End effector position
        const len = (rig.leg_len_lmt || chain.length) * limb.lengthScale;
        // Pass into the target, which does a some pre computations
        chain.target.position.copy(limb.direction.normalize()).multiplyScalar(len).add(rootWorldPos);

        if(grounding) {
            this.applyGrounding(grounding, chain, rootWorldPos);
        }

        if(!rig.ikSolver) {
            chain.ikSolver.solve(rig.pose, limb.direction, limb.jointDirection, limb);
        }
    }

    applyGrounding( limit, chain, rootPos ) {
        // Check if the end effector is below the height limit
        const targetPos = chain.target.position;
        if(targetPos.y >= limit) {
            return;
        }

        // Normalize Limit value in the Max/Min range of Y
        let normLimit = ( limit - rootPos.y ) / (targetPos.y - rootPos.y);
        
        // Change the end effector of the target: scale the range of X and Z of the chain and apply them to the start position of the chain, and put the Y in the height limit
        chain.target.position.set(rootPos.x * (1 - normLimit) + targetPos.x * normLimit, limit, rootPos.z * (1 - normLimit) + targetPos.z * normLimit);
    }

    applyLookTwist( rig, boneInfo, ik, look, twist ) {

        const bind = rig.tpose.bones[ boneInfo.idx ];
        const pose = rig.pose.bones[ boneInfo.idx ];

        let poseParentRot = pose.parent.getWorldQuaternion(new THREE.Quaternion());
        if(rig.pose.transformsWorldEmbedded) {
            poseParentRot.premultiply(rig.pose.transformsWorldEmbedded.forward.q)
        }

        let bindRot = bind.getWorldQuaternion(new THREE.Quaternion());
        if(rig.tpose.transformsWorldEmbedded) {
            bindRot.premultiply(rig.tpose.transformsWorldEmbedded.forward.q)
        }

        // Compute the bone rotation if it doesn't have any animated rotation
        const rotation = poseParentRot.clone().multiply(bind.quaternion);

        const invRot = bindRot.clone().invert();
        const altLookDir = look.clone().applyQuaternion(invRot);
        const altTwistDirection = twist.clone().applyQuaternion(invRot);
        
        //After the HIP was moved and the Limb IK is complete, this is where alternative Look Direction currently points to.
        const currentLook = altLookDir.clone().applyQuaternion(rotation).normalize();

        // Apply the final rotation to the bone to get it pointing at the right direction and twisted to match the original animation
        let swing = new THREE.Quaternion().setFromUnitVectors(currentLook, ik.look); // Compute swing rotation
        swing.multiply(rotation); // Apply swing to the bone rotation

        // Compute Twist Direction after swing rotation has been applied. Then use it to compute our twist rotation.
		const currentTwist = altTwistDirection.applyQuaternion(swing).normalize();
		const twistRot = new THREE.Quaternion().setFromUnitVectors( currentTwist, ik.twist );
		swing.premultiply( twistRot );	// Apply Twist

        swing.premultiply( poseParentRot.invert() ); // Convert to LS
		pose.quaternion.copy(swing );
    }

    applySpine( rig, chain, ik, look, twist) {

        const parent = rig.pose.bones[chain.bones[0].idx].parent;
        let poseParentPos = parent.getWorldPosition(new THREE.Vector3());
        let poseParentRot = parent.getWorldQuaternion(new THREE.Quaternion());
        if(rig.pose.transformsWorldEmbedded) {
            let mat = parent.matrix.clone();
            let cmat = new THREE.Matrix4().compose(rig.pose.transformsWorldEmbedded.forward.p, rig.pose.transformsWorldEmbedded.forward.q, rig.pose.transformsWorldEmbedded.forward.s);
            mat.premultiply(cmat);
            mat.decompose(poseParentPos, new THREE.Quaternion(), new THREE.Vector3());

            poseParentRot.premultiply(rig.pose.transformsWorldEmbedded.forward.q);
        }

        const count = chain.bones.length - 1;
        for(let i = 0; i < chain.bones.length; i++) {
            const boneInfo = chain.bones[i];
            const t = i / count * 2; // lerp time: 0 on first bone, 1 at final bone. Can be customized: increase interpolation curve, more stable it is

            const bind = rig.tpose.bones[ boneInfo.idx ];
            const pose = rig.pose.bones[ boneInfo.idx ];

            // Lerp target IK directions for this bone
            let newLook = ik[0].look.clone().lerp(ik[1].look, t);
            let newTwist = ik[0].twist.clone().lerp(ik[1].twist, t);

            // Compute directions, using defined look and twist directions
            let bindRot = bind.getWorldQuaternion(new THREE.Quaternion());
            if(rig.tpose.transformsWorldEmbedded) {
                bindRot.premultiply(rig.tpose.transformsWorldEmbedded.forward.q)
            }

            const invRot = bindRot.clone().invert();
            const altLookDir = look.clone().applyQuaternion(invRot);
            const altTwistDirection = twist.clone().applyQuaternion(invRot);

            // Compute the bone rotation if it doesn't have any animated rotation
            const rotation = poseParentRot.clone().multiply(bind.quaternion);

            const currentLook = altLookDir.clone().applyQuaternion(rotation).normalize();

            // Apply the final rotation to the bone to get it pointing at the right direction and twisted to match the original animation
            let swing = new THREE.Quaternion().setFromUnitVectors(currentLook, newLook); // Compute swing rotation
            swing.multiply(rotation); // Apply swing to the bone rotation

            // Compute Twist Direction after swing rotation has been applied. Then use it to compute our twist rotation.
            const currentTwist = altTwistDirection.applyQuaternion(swing).normalize();
            const twistRot = new THREE.Quaternion().setFromUnitVectors( currentTwist, newTwist );
            swing.premultiply( twistRot );	// Apply Twist

            const parentInv = poseParentRot.clone().invert();
            if(t != 1) {
                poseParentRot.copy(swing);
            }
            
            swing.premultiply(parentInv); // to LS
            pose.quaternion.copy(swing );
        }
    }
}

class IKCompute {

    static run(rig, ikPose) {
        this.rig = rig;
       
        this.computeHip(rig, ikPose);
        
        // Legs
        this.computeLimb(rig, rig.chains.leg_l, ikPose.leftLeg);
        this.computeLimb(rig, rig.chains.leg_r, ikPose.rightLeg);
      
        // Feet
        this.computeLookTwist( rig, rig.points.foot_l, ikPose.leftFoot, FORWARD, UP ); // Look = Forward, Twist = Up
        this.computeLookTwist( rig, rig.points.foot_r, ikPose.rightFoot, FORWARD, UP );
        
        this.computeSpine(rig, rig.chains.spine, ikPose, UP, FORWARD); // Swing = Up, Twist = Forward : for stability of the upper body
        
        // Arms
        this.computeLimb(rig, rig.chains.arm_l, ikPose.leftArm, "leftArm");
        this.computeLimb(rig, rig.chains.arm_r, ikPose.rightArm, "rightArm");
        
        this.computeLimb(rig, rig.chains.thumb_r, ikPose.rightThumb);
        this.computeLimb(rig, rig.chains.index_r, ikPose.rightIndex);
        if(rig.chains.middle_r) {
            this.computeLimb(rig, rig.chains.middle_r, ikPose.rightMiddle);
        }
        if(rig.chains.ring_r) {
            this.computeLimb(rig, rig.chains.ring_r, ikPose.rightRing);
        }
        if(rig.chains.pinky_r) {
            this.computeLimb(rig, rig.chains.pinky_r, ikPose.rightPinky);
        }

        this.computeLimb(rig, rig.chains.thumb_l, ikPose.leftThumb);
        this.computeLimb(rig, rig.chains.index_l, ikPose.leftIndex);
        if(rig.chains.middle_l) {
            this.computeLimb(rig, rig.chains.middle_l, ikPose.leftMiddle);
        }
        if(rig.chains.ring_l) {
            this.computeLimb(rig, rig.chains.ring_l, ikPose.leftRing);
        }
        if(rig.chains.pinky_l) {
            this.computeLimb(rig, rig.chains.pinky_l, ikPose.leftPinky);
        }
        // Hands
        this.computeLookTwist( rig, rig.points.hand_l, ikPose.leftHand, LEFT, BACK ); // Look = Forward, Twist = Up
        this.computeLookTwist( rig, rig.points.hand_r, ikPose.rightHand, RIGHT, BACK );

        this.computeLookTwist( rig, rig.points.neck, ikPose.neck, FORWARD, UP ); // Look = Forward, Twist = Up
        this.computeLookTwist( rig, rig.points.head, ikPose.head, FORWARD, UP ); // Look = Forward, Twist = Up
    }

    static computeHip(rig, ikPose) {
        let info = rig.points.hip; //Rig Hip info
        let pose = rig.pose.bones[info.idx]; // Animated (current) pose bone
        let bind = rig.tpose.bones[info.idx]; // TPose bone

        let tpWolrdRotation = bind.getWorldQuaternion(new THREE.Quaternion());
        if(rig.tpose.transformsWorldEmbedded) {
            tpWolrdRotation.premultiply(rig.tpose.transformsWorldEmbedded.forward.q)
        }
        let qInv = tpWolrdRotation.clone().invert();

        // Transform/translate FORWARD and UP in the orientation of the Root bone
        const forward = FORWARD.clone();
        let alt_forward = forward.clone().applyQuaternion(qInv);

        let up = UP.clone();
        let alt_up = up.clone().applyQuaternion(qInv);

        let pWolrdRotation = pose.getWorldQuaternion(new THREE.Quaternion());
        if(rig.pose.transformsWorldEmbedded) {
            pWolrdRotation.premultiply(rig.pose.transformsWorldEmbedded.forward.q)
        }
        // Rotate them based on the animation
        let pose_forward = alt_forward.applyQuaternion(pWolrdRotation);
        let pose_up = alt_up.applyQuaternion(pWolrdRotation);
        
        // Calculate the Swing and Twist values to swing to our TPose into the animation direction
        let swing = new THREE.Quaternion().setFromUnitVectors(forward, pose_forward.normalize()); // Swing rotation from on direction to the other
        
        // swing.premultiply(qInv);
        // swing.multiply(pWolrdRotation);
        
        let swing_up = UP.clone().applyQuaternion(swing); // new UP direction based only swing
        let twist = swing_up.angleTo(pose_up); // swing + pose have same FORWARD, use angle between both UPs for twist
        swing.multiply(tpWolrdRotation);// apply swing rotation to the bone rotation of the bind pose (tpose). This will do a FORWARD swing

        if( twist <= EPSILON) {
            twist = 0;
        }
        else {
            let swing_left = new THREE.Vector3().crossVectors(swing_up.normalize(), pose_forward);
            if(swing_left.dot(pose_up.normalize()) >= 0) {
                twist = -twist;
            }
        }

        // Save all information
        let pos = pose.getWorldPosition(new THREE.Vector3());
        let tpos = bind.getWorldPosition(new THREE.Vector3());
        if(rig.tpose.transformsWorldEmbedded) {
            let mat = bind.matrixWorld.clone();
            let cmat = new THREE.Matrix4().compose(rig.tpose.transformsWorldEmbedded.forward.p, rig.tpose.transformsWorldEmbedded.forward.q, rig.tpose.transformsWorldEmbedded.forward.s);
            mat.premultiply(cmat);
            mat.decompose(tpos, new THREE.Quaternion(), new THREE.Vector3());
        }
        if(rig.pose.transformsWorldEmbedded) {
            let mat = pose.matrixWorld.clone();
            let cmat = new THREE.Matrix4().compose(rig.pose.transformsWorldEmbedded.forward.p, rig.pose.transformsWorldEmbedded.forward.q, rig.pose.transformsWorldEmbedded.forward.s);
            mat.premultiply(cmat);
            mat.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
        }

        ikPose.hip.bindHeight = tpos.y; // Bind pose height of the hip (helps scaling)
        ikPose.hip.movement.subVectors(pos, tpos); // How much movement did the hip between Bind and Animated
        ikPose.hip.direction.copy(pose_forward); // Direction we want the hip to point to
        ikPose.hip.twist = twist; // How much twisting to apply after pointing in the correct direction
        
        // let arrowHelper = new THREE.ArrowHelper( FORWARD, pos, 1, "red" );
        // arrowHelper.line.material.depthTest = false;
        // arrowHelper.line.computeLineDistances();   
        // arrowHelper.name = "line";
        // window.globals.app.scene.add(arrowHelper);

        // arrowHelper = new THREE.ArrowHelper( UP, pos, 1, "red" );
        // arrowHelper.line.material.depthTest = false;
        // arrowHelper.line.computeLineDistances();   
        // arrowHelper.name = "line";
        // window.globals.app.scene.add(arrowHelper);        

        // arrowHelper = new THREE.ArrowHelper( pose_forward, pos, 1, "pink" );
        // arrowHelper.line.material.depthTest = false;
        // arrowHelper.line.computeLineDistances();   
        // arrowHelper.name = "line";
        // window.globals.app.scene.add(arrowHelper);

        // arrowHelper = new THREE.ArrowHelper( pose_up, pos, 1, "pink" );
        // arrowHelper.line.material.depthTest = false;
        // arrowHelper.line.computeLineDistances();   
        // arrowHelper.name = "line";
        // window.globals.app.scene.add(arrowHelper);  
    }

    static computeLimb(rig, chain, ikLimb, name = null) {
        const bones = chain.bones;
        const rootBone = rig.pose.bones[bones[0].idx];  // first bone
        const secondBone = rig.pose.bones[bones[2].idx];  // second bone
        const endBone = rig.pose.bones[bones[bones.length-1].idx]; // end bone
        
        const rootPos = rootBone.getWorldPosition(new THREE.Vector3());
        const rootRot = rootBone.getWorldQuaternion(new THREE.Quaternion());
        const secondPos = secondBone.getWorldPosition(new THREE.Vector3());         
        const secondRot = secondBone.getWorldQuaternion(new THREE.Quaternion());        
        const endPos = endBone.getWorldPosition(new THREE.Vector3());         
        const endRot = endBone.getWorldQuaternion(new THREE.Quaternion()); 

        if(rig.pose.transformsWorldEmbedded) {
            let mat = rootBone.matrixWorld.clone();
            let cmat = new THREE.Matrix4().compose(rig.pose.transformsWorldEmbedded.forward.p, rig.pose.transformsWorldEmbedded.forward.q, rig.pose.transformsWorldEmbedded.forward.s);
            mat.premultiply(cmat);
            mat.decompose(rootPos, rootRot, new THREE.Vector3());

            mat = secondBone.matrixWorld.clone();
            mat.premultiply(cmat);
            mat.decompose(secondPos, secondRot, new THREE.Vector3());

            mat = endBone.matrixWorld.clone();
            mat.premultiply(cmat);
            mat.decompose(endPos, endRot, new THREE.Vector3());
        }        

        chain.target.position.copy(endPos);
        let direction = new THREE.Vector3().subVectors(endPos, rootPos); // direction from the first to the final bone (IK direction)
        let length = direction.length(); // distance from the first bone to the final bone

        ikLimb.lengthScale = length / chain.length; // Normalize the distance based on the length of the chain (ratio)
        ikLimb.direction.copy(direction.normalize());

        const jointDir = chain.alt_up.clone().applyQuaternion(rootRot).normalize(); //get direction of the joint rotating the UP vector
        const leftDir = new THREE.Vector3().crossVectors(jointDir, direction).normalize(); // compute LEFT vector tp realign UP
        ikLimb.jointDirection.crossVectors(direction, leftDir).normalize(); // recompute UP, make it orthogonal to LEFT and FORWARD  
        ikLimb.directionToLimb = leftDir; //new THREE.Vector3().subVectors(secondPos, rootPos).normalize(); 

        if(ikLimb.childDirection) {
            let secondDirection = new THREE.Vector3().subVectors(endPos, secondPos).normalize(); // direction from the first to the final bone (IK direction)
            ikLimb.childDirection.copy(secondDirection);
            let childJointDir = jointDir.applyQuaternion(secondRot).normalize(); //get direction of the joint rotating the UP vector
            const childJointLeft = new THREE.Vector3().crossVectors(childJointDir, secondDirection).normalize(); // compute LEFT vector tp realign UP
            ikLimb.childJointDirection.crossVectors(secondDirection, childJointLeft).normalize(); // recompute UP, make it orthogonal to LEFT and FORWARD  
        }
        
        // let arrowHelper = window.globals.app.scene.getObjectByName("left" + (name ? "_" + name : "") );
        // if(!arrowHelper) {
        //     arrowHelper = new THREE.ArrowHelper(leftDir, rootPos, 0.2, "red" );
        //     arrowHelper.line.material = new THREE.LineDashedMaterial({color: "red", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest: false})
        //     arrowHelper.line.computeLineDistances();   
        //     arrowHelper.name = "left" + (name ? "_" + name : "");
        //     window.globals.app.scene.add(arrowHelper);
        // }
        // else {
        //     arrowHelper.setDirection(leftDir);
        //     arrowHelper.position.copy(rootPos);
        // }
    }

    static computeFingers( rig, chain, ikLimb) {
        const bones = chain.bones;
        const rootBone = rig.pose.bones[bones[0].idx];  // first bone
        const endBone = rig.pose.bones[bones[bones.length-1].idx]; // end bone
        
        const rootPos = rootBone.position;//getWorldPosition(new THREE.Vector3());
        const rootRot = rootBone.quaternion;//getWorldQuaternion(new THREE.Quaternion());
        // const endPos = endBone.getWorldPosition(new THREE.Vector3());         
        // const endRot = endBone.getWorldQuaternion(new THREE.Quaternion()); 

        let endPos = new THREE.Vector3();
        let endRot = new THREE.Quaternion();
        // Convert bone transforms in chain's root bone space
        let mat = rootBone.matrix.clone();
        mat.multiply(endBone.matrix);
        mat.decompose(endPos, endRot, new THREE.Vector3());

        // if(rig.pose.transformsWorldEmbedded) {
        //     let mat = rootBone.matrixWorld.clone();
        //     let cmat = new THREE.Matrix4().compose(rig.pose.transformsWorldEmbedded.forward.p, rig.pose.transformsWorldEmbedded.forward.q, rig.pose.transformsWorldEmbedded.forward.s);
        //     mat.premultiply(cmat);
        //     mat.decompose(rootPos, rootRot, new THREE.Vector3());

        //     mat = endBone.matrixWorld.clone();
        //     mat.premultiply(cmat);
        //     mat.decompose(endPos, endRot, new THREE.Vector3());
        // }        

        const bindRootBone = rig.tpose.bones[bones[0].idx];  // first bone
        const bindRootRot = bindRootBone.quaternion;//getWorldQuaternion(new THREE.Quaternion());
        // if(rig.tpose.transformsWorldEmbedded) {
        //     bindRootRot.premultiply( rig.tpose.transformsWorldEmbedded.forward.q);
        // }

        chain.target.position.copy(endPos);
        let direction = new THREE.Vector3().subVectors(endPos, rootPos); // direction from the first to the final bone (IK direction)
        let length = direction.length(); // distance from the first bone to the final bone

        ikLimb.lengthScale = length / chain.length; // Normalize the distance based on the length of the chain (ratio)
        ikLimb.direction.copy(direction.normalize());

        const jointDir = chain.alt_up.clone().applyQuaternion(rootRot).normalize(); //get direction of the joint rotating the UP vector
        const leftDir = new THREE.Vector3();
        leftDir.crossVectors(jointDir, direction); // compute LEFT vector tp realign UP
        ikLimb.jointDirection.crossVectors(direction, leftDir).normalize(); // recompute UP, make it orthogonal to LEFT and FORWARD   
    }

    static computeLookTwist(rig, boneInfo, ik, lookDirection, twistDirection) {
        const bind = rig.tpose.bones[boneInfo.idx]; // TPose bone
        const pose = rig.pose.bones[boneInfo.idx]; // Current Pose bone

        // Get WS rotation of bone in bind pose
        let bindRot = bind.getWorldQuaternion(new THREE.Quaternion());
        if(rig.tpose.transformsWorldEmbedded) {
            bindRot.premultiply(rig.tpose.transformsWorldEmbedded.forward.q);
        }

        // Get WS rotation of bone in current pose
        let poseRot = pose.getWorldQuaternion(new THREE.Quaternion());
        let posePos = pose.getWorldPosition(new THREE.Vector3());
        if(rig.pose.transformsWorldEmbedded) {
            poseRot.premultiply(rig.pose.transformsWorldEmbedded.forward.q);
            let cmat = new THREE.Matrix4().compose(rig.pose.transformsWorldEmbedded.forward.p, rig.pose.transformsWorldEmbedded.forward.q, rig.pose.transformsWorldEmbedded.forward.s);
            let mat = pose.matrixWorld.clone();
            mat.premultiply(cmat);
            mat.decompose(posePos, new THREE.Quaternion(), new THREE.Vector3());
        }

        // Look dir = Forward (follow the bone), Twist dir = Up
        const invRot = bindRot.invert();
        const altLookDir = lookDirection.clone().applyQuaternion(invRot);
        const altTwistDirection = twistDirection.clone().applyQuaternion(invRot);

        const poseLookDirection = altLookDir.applyQuaternion(poseRot);
        const poseTwistDirection = altTwistDirection.applyQuaternion(poseRot);

        ik.toVisualize = {
            pos: pose.getWorldPosition(new THREE.Vector3()),
            lookDir:lookDirection,
            twist: twistDirection
        }
        ik.look.copy(poseLookDirection);
        ik.twist.copy(poseTwistDirection);
    }

    static computeSpine(rig, chain, ikPose, look, twist) {
        for(let i = 0; i < chain.bones.length; i++) {
            const boneInfo = chain.bones[i];
            const bind = rig.tpose.bones[boneInfo.idx];
            const pose = rig.pose.bones[boneInfo.idx];

            // Create quat inverse direction
            let bindRot = bind.getWorldQuaternion(new THREE.Quaternion());
            if(rig.tpose.transformsWorldEmbedded) {
                bindRot.premultiply(rig.tpose.transformsWorldEmbedded.forward.q);
            }

            let poseRot = pose.getWorldQuaternion(new THREE.Quaternion());
            if(rig.pose.transformsWorldEmbedded) {
                poseRot.premultiply(rig.pose.transformsWorldEmbedded.forward.q);
            }
            
            const invRot = bindRot.clone().invert();

            const newLook = look.clone().applyQuaternion(invRot);
            const newTwist = twist.clone().applyQuaternion(invRot);

            newLook.applyQuaternion(poseRot);
            newTwist.applyQuaternion(poseRot);

            ikPose.spine[i].look = newLook;
            ikPose.spine[i].twist = newTwist;
        }
    }
}

class IKVisualize {
    static run(ikRig, ik, scene, name) {
        this.hip(ikRig, ik, scene, name);
        this.limb(ikRig, ikRig.chains, "leg_l", ik.leftLeg, scene, name);
        this.limb(ikRig, ikRig.chains, "leg_r", ik.rightLeg, scene, name);
        this.limb(ikRig, ikRig.chains, "arm_l", ik.leftArm, scene, name);
        this.limb(ikRig, ikRig.chains, "arm_r", ik.rightArm, scene, name);
        // this.limb(ikRig, ikRig.chains, "thumb_r", ik.rightThumb, scene, name);
        // this.limb(ikRig, ikRig.chains, "index_r", ik.rightIndex, scene, name);
        // if(ikRig.chains.middle_r) {
        //     this.limb(ikRig, ikRig.chains, "middle_r", ik.rightMiddle, scene, name);
        // }
        // if(ikRig.chains.ring_r) {
        //     this.limb(ikRig, ikRig.chains, "ring_r", ik.rightRing, scene, name);
        // }
        // if(ikRig.chains.pinky_r) {
        //     this.limb(ikRig, ikRig.chains, "pinky_r", ik.rightPinky, scene, name);
        // }
        // this.foot(ikRig, ikRig.points.foot_l, "foot_l", ik.leftFoot, scene, name);
        // this.foot(ikRig, ikRig.points.foot_r, "foot_r", ik.rightFoot, scene, name);
    }

    static hip(ikRig, ik, scene, name) {
        
        let sphere = scene.getObjectByName("hipSphere_" + name);
        if(!sphere) {
            const geometry = new THREE.SphereGeometry( 0.005, 10, 10 ); 
            const material = new THREE.MeshBasicMaterial( { color: "orange", depthTest: false } ); 
            sphere = new THREE.Mesh( geometry, material ); 
            sphere.name = "hipSphere_" + name;
            scene.add(sphere);
        }

        ikRig.pose.bones[ikRig.points.hip.idx].getWorldPosition(sphere.position);

        let arrowHelper = scene.getObjectByName("hipLine_"+name);
        if(!arrowHelper) {
            arrowHelper = new THREE.ArrowHelper( ik.hip.direction, sphere.position, 0.2, "cyan" );
            arrowHelper.line.material = new THREE.LineDashedMaterial({color: "cyan", scale: 1, dashSize: 0.1, gapSize: 0.1})
            arrowHelper.line.computeLineDistances();   
            arrowHelper.name = "hipLine_"+name;
            scene.add(arrowHelper);
        }
        else {
            arrowHelper.setDirection(ik.hip.direction);
            arrowHelper.position.copy(sphere.position);
        }
    }

    static limb(ikRig, chains, chainName, ik, scene, name) {
        const len = chains[chainName].length * ik.lengthScale;

        let firstSphere = scene.getObjectByName("limbFirstSphere_" + chainName + "_" + name);
        if(!firstSphere) {
            const geometry = new THREE.SphereGeometry( 0.005, 10, 10 ); 
            const material = new THREE.MeshBasicMaterial( { color: "yellow", depthTest: false} ); 
            firstSphere = new THREE.Mesh( geometry, material ); 
            firstSphere.name = "limbFirstSphere_" + chainName + "_" + name;
            scene.add(firstSphere);
        }

        let lastSphere = scene.getObjectByName("limbLastSphere_" + chainName + "_" + name);
        if(!lastSphere) {
            const geometry = new THREE.SphereGeometry( 0.005, 10, 10 ); 
            const material = new THREE.MeshBasicMaterial( { color: "orange", depthTest: false } ); 
            lastSphere = new THREE.Mesh( geometry, material ); 
            lastSphere.name = "limbLastSphere_" + chainName + "_" + name;
            scene.add(lastSphere);
        }

        const bones = chains[chainName].bones;
        ikRig.pose.bones[bones[0].idx].getWorldPosition(firstSphere.position); //First bone
       
        let lastPos = ik.direction.clone();
        lastPos.multiplyScalar(len).add(firstSphere.position);
        lastSphere.position.copy(lastPos);
        // ikRig.pose.bones[bones[bones.length-1].idx].getWorldPosition(lastSphere.position); //End bone
        
        let direction = name == this.sourceName ? ik.direction : chains[chainName].ikSolver.srcForward;
        let directionArrow = scene.getObjectByName("limbDirectionLine_" + chainName + "_" + name);
        if(!directionArrow) {
            directionArrow = new THREE.ArrowHelper( direction, firstSphere.position, len, "yellow", 0.01 );
            directionArrow.line.material = new THREE.LineDashedMaterial({color: "yellow", scale: 1, dashSize: 0.05, gapSize: 0.05, depthTest:false})
            directionArrow.line.computeLineDistances();   
            directionArrow.name = "limbDirectionLine_" + chainName + "_" + name;
            scene.add(directionArrow);
        }
        else {
            directionArrow.setDirection(direction);
            directionArrow.position.copy(firstSphere.position);
        }

        let arrowHelper = scene.getObjectByName("limbLine_" + chainName + "_" + name);
        let jDirection = name == this.sourceName ? ik.jointDirection : chains[chainName].ikSolver.srcUp;
        if(!arrowHelper) {
            arrowHelper = new THREE.ArrowHelper( jDirection, firstSphere.position, 0.2, "cyan" );
            arrowHelper.line.material = new THREE.LineDashedMaterial({color: "cyan", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest: false})
            arrowHelper.line.computeLineDistances();   
            arrowHelper.name = "limbLine_" + chainName + "_" + name;
            scene.add(arrowHelper);
        }
        else {
            arrowHelper.setDirection(jDirection);
            arrowHelper.position.copy(firstSphere.position);
        }
       
        let target = scene.getObjectByName("targetSphere_" + chainName + "_" + name);
        if(!target) {
            const geometry = new THREE.SphereGeometry( 0.005, 10, 10 ); 
            const material = new THREE.MeshBasicMaterial( { color: "red", depthTest: false } ); 
            target = new THREE.Mesh( geometry, material ); 
            target.name = "targetSphere_" + chainName + "_" + name;
            scene.add(target);
        }
        target.position.copy(chains[chainName].target.position);
        // if(name == 'vegeta') {
            // target.position.x+=0.5+ikRig.pose.bones[0].position.x;
        //   target.position.z+= ikRig.pose.bones[0].position.z;
        // }
        // let arrow = new THREE.ArrowHelper( ik.toVisualize.jointDir, ik.toVisualize.pos, len, "white", 0.01 );
        // scene.add(arrow);
        // arrow = new THREE.ArrowHelper( ik.toVisualize.leftDir, ik.toVisualize.pos, len, "orange", 0.01 );
        // scene.add(arrow);
        // arrow = new THREE.ArrowHelper( ik.toVisualize.chainDir, ik.toVisualize.pos, len, "yellow", 0.01 );
        // scene.add(arrow);
        // arrow = new THREE<.ArrowHelper( ik.toVisualize.newJointDir, ik.toVisualize.pos, len, "red", 0.01 );
        // scene.add(arrow);
    }

    static foot(ikRig, boneInfo, chainName, ik, scene, name) {

        let sphere = scene.getObjectByName("sphere_" + chainName + "_" + name);
        if(!sphere) {
            const geometry = new THREE.SphereGeometry( 0.02, 10, 10 ); 
            const material = new THREE.MeshBasicMaterial( { color: "cyan", depthTest: false} ); 
            sphere = new THREE.Mesh( geometry, material ); 
            sphere.name = "sphere_" + chainName + "_" + name;
            scene.add(sphere);
        }

        ikRig.pose.bones[boneInfo.idx].getWorldPosition(sphere.position);

        let arrowHelper = scene.getObjectByName("look" + chainName + "_" + name);
        if(!arrowHelper) {
            arrowHelper = new THREE.ArrowHelper( ik.look, sphere.position, 0.2, "blue" );
            arrowHelper.line.material = new THREE.LineDashedMaterial({color: "blue", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest:false})
            arrowHelper.line.computeLineDistances();   
            arrowHelper.name = "look" + chainName + "_" + name;
            scene.add(arrowHelper);
        }
        else {
            arrowHelper.setDirection(ik.look);
            arrowHelper.position.copy(sphere.position);
        }

        arrowHelper = scene.getObjectByName("twist" + chainName + "_" + name);
        if(!arrowHelper) {
            arrowHelper = new THREE.ArrowHelper( ik.twist, sphere.position, 0.2, "cyan" );
            arrowHelper.line.material = new THREE.LineDashedMaterial({color: "cyan", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest:false})
            arrowHelper.line.computeLineDistances();   
            arrowHelper.name = "twist" + chainName + "_" + name;
            scene.add(arrowHelper);
        }
        else {
            arrowHelper.setDirection(ik.twist);
            arrowHelper.position.copy(sphere.position);
        }

        if(!ik.toVisualize)
            return;

        // const len = 1;
        // let arrow = new THREE.ArrowHelper( ik.toVisualize.lookDir, ik.toVisualize.pos, len, "white", 0.01 );
        // scene.add(arrow);

        // arrow = new THREE.ArrowHelper( ik.toVisualize.twistDir, ik.toVisualize.pos, len, "white", 0.01 );
        // scene.add(arrow);

        // arrow = new THREE.ArrowHelper( ik.look, ik.toVisualize.pos, len, "orange", 0.01 );
        // scene.add(arrow);

        // arrow = new THREE.ArrowHelper( ik.twist, ik.toVisualize.pos, len, "orange", 0.01 );
        // scene.add(arrow);
    }
}

class IKSolver {
    constructor(skeleton, chain, multi = false) {
        this.skeleton = skeleton;
        this.chain = chain;
        this.target = chain.target;
        this.srcForward = new THREE.Vector3(0,0,1);
        this.srcLeft = new THREE.Vector3(1,0,0);
        this.srcUp = new THREE.Vector3(0,1,0);
        this.multi = multi;
    }

    // forward = direction, up = joint direction (look at)
    solve(pose, forward, up, info) {
        if(!this.multi) {
            this.limbSolver(pose, forward, up);
        }
        else {
            this.multiSolver(pose, forward, up);
        }       
    }
    
    limbSolver(pose, forward, up, info = {}) { // forward = src direcition, up = src joint direction
        this.srcForward = forward.normalize();
        this.srcLeft = info.directionToLimb ? info.directionToLimb : new THREE.Vector3().crossVectors(up, this.srcForward).normalize();
        this.srcUp = new THREE.Vector3().crossVectors(this.srcForward, this.srcLeft).normalize();

        const chain = this.chain;
        let bindSecond = pose.bones[chain.bones[1].idx]; 

        let poseFirst = pose.bones[chain.bones[0].idx]; // Bone reference from Current pose
        let poseSecond = pose.bones[chain.bones[1].idx]; 

        const bindFirstLen = chain.bones[0].len;
        const bindSecondLen = chain.bones[1].len;

        // FIRST BONE - Aim then rotate by the angle.
        
        let parentPoseRot = poseFirst.parent.getWorldQuaternion(new THREE.Quaternion());
        let firstPoseRot = poseFirst.getWorldQuaternion(new THREE.Quaternion());
        let poseFirstPos = poseFirst.getWorldPosition(new THREE.Vector3());

        if(pose.transformsWorldEmbedded) {
            parentPoseRot.premultiply(pose.transformsWorldEmbedded.forward.q)
            let cmat = new THREE.Matrix4().compose(pose.transformsWorldEmbedded.forward.p, pose.transformsWorldEmbedded.forward.q, pose.transformsWorldEmbedded.forward.s);
            let mat = poseFirst.matrixWorld.clone();
            mat.premultiply(cmat);
            mat.decompose(poseFirstPos, firstPoseRot, new THREE.Vector3());
        }

        // Aim the first bone towards the target oriented with the bend direction.
        let firstBoneRotation = this.aimBone(chain.bones[0].idx, this.srcForward, this.srcUp);
                
        const chainLen = new THREE.Vector3().subVectors(chain.target.position, poseFirstPos).length();


        // let arrowHelper = window.globals.app.scene.getObjectByName("forward1" );
        // if(!arrowHelper) {
        //     arrowHelper = new THREE.ArrowHelper(this.srcForward, poseFirstPos, chainLen, "blue" );
        //     arrowHelper.line.material = new THREE.LineDashedMaterial({color: "blue", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest: false})
        //     arrowHelper.line.computeLineDistances();   
        //     arrowHelper.cone.material.depthTest = false;
        //     arrowHelper.name = "forward_";
        //     window.globals.app.scene.add(arrowHelper);
        // }
       
        // arrowHelper = window.globals.app.scene.getObjectByName("up1" );
        // if(!arrowHelper) {
        //     arrowHelper = new THREE.ArrowHelper(this.srcUp, poseFirstPos, 0.2, "green" );
        //     arrowHelper.line.material = new THREE.LineDashedMaterial({color: "green", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest:false})
        //     arrowHelper.line.computeLineDistances();   
        //     arrowHelper.name = "up_";
        //     window.globals.app.scene.add(arrowHelper);
        // }

        // arrowHelper = window.globals.app.scene.getObjectByName("left_solver" );
        // if(!arrowHelper) {
        //     arrowHelper = new THREE.ArrowHelper(this.srcLeft, poseFirstPos, 0.2, "red" );
        //     arrowHelper.line.material = new THREE.LineDashedMaterial({color: "red", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest:false})
        //     arrowHelper.line.computeLineDistances();   
        //     arrowHelper.name = "left_";
        //     window.globals.app.scene.add(arrowHelper);
        // }


        // arrowHelper = window.globals.app.scene.getObjectByName("pp" );
        // if(!arrowHelper) {
        //     arrowHelper = new THREE.ArrowHelper(this.srcForward, poseFirstPos, bindFirstLen, "orange" );
        //     arrowHelper.line.material = new THREE.LineDashedMaterial({color: "orange", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest:false})
        //     arrowHelper.line.computeLineDistances();  
        //     arrowHelper.cone.material.depthTest = false;
 
        //     arrowHelper.name = "pp_";
        //     window.globals.app.scene.add(arrowHelper);
        // }

        // arrowHelper = window.globals.app.scene.getObjectByName("bb" );
        // if(!arrowHelper) {
        //     arrowHelper = new THREE.ArrowHelper(this.srcForward, poseSecond.getWorldPosition(new THREE.Vector3()), bindSecondLen, "pink" );
        //     arrowHelper.line.material = new THREE.LineDashedMaterial({color: "pink", scale: 1, dashSize: 0.1, gapSize: 0.1, depthTest:false})
        //     arrowHelper.line.computeLineDistances();  
        //     arrowHelper.cone.material.depthTest = false;
 
        //     arrowHelper.name = "pbbp_";
        //     window.globals.app.scene.add(arrowHelper);
        // }



        // Get the angle between the first bone and the target (last bone)
        let angle = lawCosSSS(bindFirstLen, chainLen, bindSecondLen);

        // Use the target's X axis for rotation along with the angle from SSS
        firstBoneRotation.premultiply(new THREE.Quaternion().setFromAxisAngle(this.srcLeft, -angle));
        // if(info.childDirection) {
        //     let childForward = info.childDirection.normalize();
        //     let childLeft = new THREE.Vector3().crossVectors(info.childJointDirection, childForward).normalize();
        //     let childUp = new THREE.Vector3().crossVectors(childForward, childLeft).normalize();
        //     let rotation = this.aimBone(chain.bones[1].idx, childForward, childUp);
        //     firstBoneRotation.multiply(rotation.invert());
        // }
        let rotationLS = firstBoneRotation.clone();
       
        rotationLS.premultiply(parentPoseRot.invert()); // Convert to bone's LS by multiplying the inverse rotation of the parent

        poseFirst.quaternion.copy(rotationLS);
        poseFirst.updateWorldMatrix(true, true);
        
        //-----------------------------------------------------------
        // SECOND BONE - Rotate in the other direction
        angle = Math.PI - lawCosSSS(bindFirstLen, bindSecondLen, chainLen);
        const invRot = firstBoneRotation.clone().invert();
        
        let secondBoneRotation = firstBoneRotation// firstBoneRotation.multiply(poseSecond.quaternion); // Convert LS second bind bone rotation in the WS of the first current pose bone 
        secondBoneRotation.premultiply(new THREE.Quaternion().setFromAxisAngle(this.srcLeft, angle)); // Rotate it by the target's X axis
        secondBoneRotation.premultiply(invRot); // Convert to bone's LS

        poseSecond.quaternion.copy(secondBoneRotation);
        poseSecond.updateWorldMatrix(true, true);
    }

    multiSolver(pose, forward, up, srcdirection) {
        this.srcForward = forward.normalize();
        this.srcLeft = new THREE.Vector3().crossVectors(up, this.srcForward).normalize();
        this.srcUp = new THREE.Vector3().crossVectors(this.srcForward, this.srcLeft).normalize();

        const chain = this.chain;

        let poseFirst = pose.bones[chain.bones[0].idx]; // Bone reference from Current pose
        let poseSecond = pose.bones[chain.bones[1].idx]; 
        let poseEnd = pose.bones[chain.bones[2].idx]; 
        poseEnd.updateWorldMatrix(true, false);

        const bindFirstLen = chain.bones[0].len;
        const bindSecondLen = chain.bones[1].len;
        const bindEndLen = chain.bones[2].len;
        
        let parentPoseRot = poseFirst.parent.getWorldQuaternion(new THREE.Quaternion());
        let poseFirstPos = poseFirst.getWorldPosition(new THREE.Vector3());
        let poseSecondPos = poseSecond.getWorldPosition(new THREE.Vector3());
        let poseEndPos = poseEnd.getWorldPosition(new THREE.Vector3());


        if(pose.transformsWorldEmbedded) {
            parentPoseRot.premultiply(pose.transformsWorldEmbedded.forward.q)
            let cmat = new THREE.Matrix4().compose(pose.transformsWorldEmbedded.forward.p, pose.transformsWorldEmbedded.forward.q, pose.transformsWorldEmbedded.forward.s);
            let mat = poseFirst.matrixWorld.clone();
            mat.premultiply(cmat);
            mat.decompose(poseFirstPos, new THREE.Quaternion(), new THREE.Vector3());
            mat = poseSecond.matrixWorld.clone();
            mat.premultiply(cmat);
            mat.decompose(poseEndPos, new THREE.Quaternion(), new THREE.Vector3());
            mat = poseEnd.matrixWorld.clone();
            mat.premultiply(cmat);
            mat.decompose(poseEndPos, new THREE.Quaternion(), new THREE.Vector3());
        }

        const chainLen = new THREE.Vector3().subVectors(chain.target.position, poseFirstPos).length();

        const hbindSecondLen = bindSecondLen*0.7;
        const t = (bindFirstLen + hbindSecondLen) / (bindFirstLen + bindSecondLen + bindEndLen); // how much to subduvude the target length
        const tBindFirstLen = chainLen * t; // A to B
        const tBindSecondLen = chainLen - tBindFirstLen; // B to C

        // let rotation = new THREE.Quaternion();

        // FIRST BONE - Aim then rotate by the angle.
        // Aim the first bone towards the target oriented with the bend direction.
        let rotation = this.aimBone(chain.bones[0].idx, this.srcForward, this.srcUp);

        //------------
        // Get the angle between the first bone and the target (last bone)
        let angle =  lawCosSSS(bindFirstLen, tBindFirstLen, hbindSecondLen );
        // Use the target's X axis for rotation along with the angle from SSS
        rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(this.srcLeft, -angle));
        let rotationLS = rotation.clone();
        rotationLS.premultiply(parentPoseRot.invert()); // Convert to bone's LS by multiplying the inverse rotation of the parent

        poseFirst.quaternion.copy(rotationLS);
        poseFirst.updateWorldMatrix(true, true);

        // SECOND BONE
        angle = Math.PI - lawCosSSS(bindFirstLen, hbindSecondLen, tBindFirstLen);
        let invRot = rotation.clone().invert();
        // rotation.multiplyQuaternions(rotation, poseSecond.quaternion); // Convert LS second bind bone rotation in the WS of the first current pose bone 
        rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(this.srcLeft, angle)); // Rotate it by the target's X axis
        
        rotationLS = rotation.clone();
        rotationLS.premultiply(invRot); // Convert to bone's LS

        poseSecond.quaternion.copy(rotationLS);
        poseSecond.updateWorldMatrix(true, true);

        // THIRD BONE
        angle = Math.PI - lawCosSSS(bindEndLen, bindSecondLen - hbindSecondLen, tBindSecondLen)
        invRot = rotation.clone().invert();
        // rotation.multiplyQuaternions(rotation, poseEnd.quaternion); // Convert LS second bind bone rotation in the WS of the first current pose bone 
        rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(this.srcLeft, angle)); // Rotate it by the target's X axis
        
        rotationLS = rotation.clone();
        rotationLS.premultiply(invRot); // Convert to bone's LS

        poseEnd.quaternion.copy(rotationLS);
        poseEnd.updateWorldMatrix(true, true);
    }

    aimBone(boneIdx, srcForward, srcUp) {
        const tpose = this.skeleton;
        const chain = this.chain;

        // Get WS rotation of First bone
        const bindFirst = tpose.bones[boneIdx]; // Bone reference from Bind pose
        
        let bindFirstRot = bindFirst.getWorldQuaternion(new THREE.Quaternion());
        if(tpose.transformsWorldEmbedded) {
            bindFirstRot.premultiply(tpose.transformsWorldEmbedded.forward.q)
        }
        
        // Compute local forward (bone direction) for target
        let trgForward = chain.alt_forward.clone().applyQuaternion(bindFirstRot).normalize();

        // Swing
        let swing = new THREE.Quaternion().setFromUnitVectors(trgForward, srcForward);
        let finalRot = bindFirstRot.premultiply(swing);
        
        // Twist
        let trgUp = chain.alt_up.clone().applyQuaternion(finalRot).normalize(); // Find new Up after swing applyied
        let twist = srcUp.angleTo(trgUp); // Get angle difference between Swing Up and Target Up

        if(twist <= EPSILON) {
            twist = 0;
        }
        else {
            let trgLeft = trgUp.cross(srcForward);
            // let srcLeft = srcUp.cross(srcForward).normalize();
            if(trgLeft.dot(srcUp) >= 0) {
            // if(srcLeft.dot(trgUp) < 0) {
                twist = - twist;
            }
        }

        finalRot.premultiply(new THREE.Quaternion().setFromAxisAngle(srcForward, twist));
        return finalRot;
    }
}

THREE.SkeletonHelper.prototype.changeColor = function ( a, b ) {

    //Change skeleton helper lines colors
    let colorArray = this.geometry.attributes.color.array;
    for(let i = 0; i < colorArray.length; i+=6) { 
        colorArray[i+3] = 58/256; 
        colorArray[i+4] = 161/256; 
        colorArray[i+5] = 156/256;
    }
    this.geometry.attributes.color.array = colorArray;
    this.material.linewidth = 5;
}

// Law of cosines SSS: To find an angle of a triangle when all rhree length sides are known (https://mathsisfun.com/algebra/trig-cosine-law.html)
function lawCosSSS(a,b,c) {
    let v = (Math.pow(a,2) + Math.pow(b,2) - Math.pow(c,2)) / (2*a*b);
    if(v > 1) {
        v = 1;
    }
    else if ( v < -1) {
        v = -1;
    }
    return Math.acos(v);
}

export {IKCompute, IKRig, IKPose, IKSolver, IKVisualize}