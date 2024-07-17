import * as THREE from 'three';
//import { normalize } from 'three/src/math/MathUtils.js';


// asymetric and/or negative scaling of objects is not properly supported 
class AnimationRetargeting {

    /**
    * @DEFAULT Uses skeleton's actual bind pose
    * @CURRENT Uses skeleton's current pose
    * @TPOSE Forces the skeleton's current pose to T-pose and uses skeleton's current pose
    */
    static BindPoseModes = { DEFAULT : 0, CURRENT: 1, TPOSE : 2}
    
    /**
     * Retargets animations and/or current poses from one skeleton to another. 
     * Both skeletons must have the same bind pose (same orientation for each mapped bone) in order to properly work.
     * Use optional parameters to adjust the bind pose.
     * @param srcSkeleton Skeleton of source avatar. Its bind pose must be the same as trgSkeleton. The original skeleton is cloned and can be safely modified
     * @param trgSkeleton Same as srcSkeleton but for the target avatar
     * @param options.srcPoseMode BindPoseModes enum values. Pose of the srcSkeleton that will be used as the bind pose for the retargeting. By default, skeleton's actual bind pose is used.
     * @param options.trgPoseMode BindPoseModes enum values. Same as srcPoseMode but for the target avatar.

     * @param options.srcEmbedWorldTransforms Bool. Retargeting only takes into account transforms from the actual bone objects. 
     * If set to true, external (parent) transforms are computed and embedded into the root joint. 
     * Afterwards, parent transforms/matrices can be safely modified and will not affect in retargeting.
     * Useful when it is easier to modify the container of the skeleton rather than the actual skeleton in order to align source and target poses
     * @param options.trgEmbedWorldTransforms Same as srcEmbedWorldTransforms but for the target avatar
     * @param options.boneNameMap String-to-string mapping between src and trg through bone names. Only supports one-to-one mapping
     */
    constructor( srcSkeleton, trgSkeleton, options = null ){
        if (!options){ options = {}; }

        this.srcSkeleton = srcSkeleton; // original ref
        if ( !srcSkeleton.boneInverses ){ // find its skeleton
            srcSkeleton.traverse( (o) => { if( o.isSkinnedMesh ){ this.srcSkeleton = o.skeleton; } } );
        }
        this.trgSkeleton = trgSkeleton; // original ref
        if ( !trgSkeleton.boneInverses ){ // find its skeleton
            trgSkeleton.traverse( (o) => { if( o.isSkinnedMesh ){ this.trgSkeleton = o.skeleton; } } );
        }
        
        this.chains = {
            leftArmBaseName: "LeftArm",
            leftArmEndName: "LeftHand",
            rightArmBaseName: "RightArm",
            rightArmEndName: "RightHand",
            leftLegBaseName: "LeftUpLeg",
            leftLegEndName: "LeftFoot",
            rightLegBaseName: "RightUpLeg",
            rightLegEndName: "RightFoot",
            spineBaseName: "Hips",
            spineEndName: "Spine"
        }

        this.boneMap = this.computeBoneMap( this.srcSkeleton, this.trgSkeleton, options.boneNameMap ); // { idxMap: [], nameMape:{} }
        this.srcBindPose = this.cloneRawSkeleton( this.srcSkeleton, options.srcPoseMode, options.srcEmbedWorldTransforms ); // returns pure skeleton, without any object model applied 
        this.trgBindPose = this.cloneRawSkeleton( this.trgSkeleton, options.trgPoseMode, options.trgEmbedWorldTransforms ); // returns pure skeleton, without any object model applied

        this.precomputedQuats = this.precomputeRetargetingQuats();
        this.precomputedPosition = this.precomputeRetargetingPosition();
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
        if(poseMode == AnimationRetargeting.BindPoseModes.TPOSE) {
            skeleton.pose();
        }
        let resultBones = new Array( bones.length );
        let parentIndices = new Int16Array( bones.length );

        // bones[0].clone( true ); // recursive
        for( let i = 0; i < bones.length; ++i ){
            resultBones[i] = bones[i].clone();
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
            case AnimationRetargeting.BindPoseModes.CURRENT: 
                resultSkeleton = new THREE.Skeleton( resultBones ); // will automatically compute the inverses from the matrixWorld of each bone               
                
                break;
            case AnimationRetargeting.BindPoseModes.TPOSE:
                 // Force bind pose as T-pose
                resultSkeleton = new THREE.Skeleton( resultBones );
                resultSkeleton.pose();           
                resultSkeleton = this.applyTPose(resultSkeleton, skeleton == this.trgSkeleton);
                resultSkeleton = new THREE.Skeleton( resultSkeleton.bones)
                resultSkeleton.update();
                break;
            default:
                let boneInverses = new Array( skeleton.boneInverses.length );
                for( let i = 0; i < boneInverses.length; ++i ) { 
                    boneInverses[i] = skeleton.boneInverses[i].clone(); 
                }
                resultSkeleton = new THREE.Skeleton( resultBones, boneInverses );
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


    /**
     * Maps bones from one skeleton to another given boneMap. 
     * Given a null bonemap, an automap is performed
     * @param {THREE.Skeleton} srcSkeleton 
     * @param {THREE.Skeleton} trgSkeleton 
     * @param {object} boneMap { string: string }
     * @returns {object} { idxMap: [], nameMape: {} }
     */
    computeBoneMap( srcSkeleton, trgSkeleton, boneMap = null ){
        let srcBones = srcSkeleton.bones;
        let trgBones = trgSkeleton.bones;
        let result = {
            idxMap: new Int16Array( srcBones.length ),
            nameMap: {}
        }
        result.idxMap.fill( -1 ); // default to no map;
        this.chainsToSet = Object.assign({}, this.chains);

        if ( boneMap ){
            for ( let srcName in boneMap ){
                let idx = findIndexOfBoneByName( srcSkeleton, srcName );    
                if ( idx < 0 ){ continue; }
                for(let name in this.chains) {
                    if(!this.chainsToSet[name]) {
                        continue;
                    }
                    if(srcName.toLowerCase().includes(this.chains[name].toLocaleLowerCase())) {
                        this.chains[name] = srcName;
                        this.chainsToSet[name] = false;
                        break;
                    }
                }
                let trgIdx = findIndexOfBoneByName( trgSkeleton, boneMap[ srcName ] ); // will return either a valid index or -1
                result.idxMap[ idx ] = trgIdx;
                result.nameMap[ srcName ] = boneMap[ srcName ];
            }
        }else{
            // automap
            for( let i = 0; i < srcBones.length; ++i ){
                let srcName = srcBones[i].name;
                if ( typeof( srcName ) !== "string" ){ continue; }
                srcName = srcName.toLowerCase().replace( "mixamorig", "" ).replace( /[`~!@#$%^&*()_|+\-=?;:'"<>\{\}\\\/]/gi, "" );
                if ( srcName.length < 1 ){ continue; }

                for(let name in this.chains) {
                    if(!this.chainsToSet[name]) {
                        continue;
                    }
                    if(srcName.toLowerCase().includes(this.chains[name].toLocaleLowerCase())) {
                        this.chains[name] = srcBones[i].name;
                        this.chainsToSet[name] = false;
                        break;
                    }
                }
                for( let j = 0; j < trgBones.length; ++j ){
                    let trgName = trgBones[j].name;
                    if ( typeof( trgName ) !== "string" ){ continue; }
                    trgName = trgName.toLowerCase().replace( "mixamorig", "" ).replace( /[`~!@#$%^&*()_|+\-=?;:'"<>\{\}\\\/]/gi, "" );
                    if ( srcName == trgName ){
                        result.idxMap[i] = j;
                        result.nameMap[ srcBones[i].name ] = trgBones[j].name; 
                    }
                }
            }
        }

        return result
    }

    /**
     * Apply a T-pose shape to the passed skeleton.     
     * @param {THREE.Skeleton} skeleton 
     * @param {boolean} useMap 
     */
    applyTPose(skeleton, useMap = false) {
        let leftArmBaseName  = this.chains.leftArmBaseName;
        let leftArmEndName   = this.chains.leftArmEndName;
        let rightArmBaseName = this.chains.rightArmBaseName;
        let rightArmEndName  = this.chains.rightArmEndName;
        let leftLegBaseName  = this.chains.leftLegBaseName;
        let leftLegEndName   = this.chains.leftLegEndName;
        let rightLegBaseName = this.chains.rightLegBaseName;
        let rightLegEndName  = this.chains.rightLegEndName;
        let spineBaseName    = this.chains.spineBaseName;
        let spineEndName     = this.chains.spineEndName;

        
        if(useMap) {
            leftArmBaseName  = this.boneMap.nameMap[leftArmBaseName];
            leftArmEndName   = this.boneMap.nameMap[leftArmEndName];
            rightArmBaseName = this.boneMap.nameMap[rightArmBaseName];
            rightArmEndName  = this.boneMap.nameMap[rightArmEndName];
            leftLegBaseName  = this.boneMap.nameMap[leftLegBaseName];
            leftLegEndName   = this.boneMap.nameMap[leftLegEndName];
            rightLegBaseName = this.boneMap.nameMap[rightLegBaseName];
            rightLegEndName  = this.boneMap.nameMap[rightLegEndName];
            spineBaseName    = this.boneMap.nameMap[spineBaseName];
            spineEndName     = this.boneMap.nameMap[spineEndName];
        }
        
        //------------------------------------ LOOK AT Z-AXIS ------------------------------------//
        // Check if the skeleton is oriented in the +Z using the plane fromed by leftArm and spine
        let leftBaseLeg = skeleton.getBoneByName(leftLegBaseName); // left up leg
        let hips = leftBaseLeg.parent; // hips
        
        let leftBaseLegPos = leftBaseLeg.getWorldPosition(new THREE.Vector3());
        let hipsPos = hips.getWorldPosition(new THREE.Vector3());        // new THREE.Vector3().setFromMatrixPosition(hips.matrixWorld); // BEST PERFORMANCE

        // Compute up leg direciton
        let lefLegDir = new THREE.Vector3();
        lefLegDir.subVectors(leftBaseLegPos, hipsPos).normalize();

        const spineBase = skeleton.getBoneByName(spineEndName); // spine
        
        const spineBasePos = spineBase.getWorldPosition(new THREE.Vector3());
        
        // Compute spine direction
        let spineDir = new THREE.Vector3();
        let spineDirO = new THREE.Vector3();
        spineDirO.subVectors(spineBasePos, hipsPos);
        spineDir.subVectors(spineBasePos, hipsPos).normalize();
        
        // Compute perpendicular axis between left up and hips-spine
        let axis = new THREE.Vector3();        
        axis.crossVectors(lefLegDir, spineDir).normalize();

        let zAxis = new THREE.Vector3(0, 0, 1);
        // Compute angle (rad) between perpendicular axis and z-axis
        let angle = (zAxis).angleTo(axis);
       
        if(Math.abs(angle) > 0.001) {
            let rot = new THREE.Quaternion();//.setFromAxisAngle(yAxis, -angle);

            // Get spine bone global rotation 
            let hipsRot = hips.getWorldQuaternion(new THREE.Quaternion());
            // Apply computed rotation to the spine bone global rotation
            rot = rot.setFromUnitVectors(axis, zAxis)
            spineDirO.applyQuaternion(rot);
            hipsRot = hipsRot.multiply(rot);
            
            if (hips.parent) {
                let parent = hips.parent;
                let hipsParentRot = parent.getWorldQuaternion(new THREE.Quaternion());
                // Convert new spine bone global rotation to local rotation and set to the bone
                hips.quaternion.copy(hipsRot.multiply(hipsParentRot.invert()));
                let hipsParentPos = parent.getWorldPosition(new THREE.Vector3());

                hips.position.copy(spineDirO.sub(hipsParentPos));

            }
            else {
                hips.quaternion.copy(hipsRot);
                hips.position.copy(spineDirO);
            }
            // Update bone matrix and children matrices
            hips.updateMatrix();
            hips.updateMatrixWorld(true, true);
        }

        let yAxis = new THREE.Vector3(0, 1, 0);
        this.alignBoneToAxis(hips, yAxis);

        //------------------------------------ LEGS ALIGNED TO Y-AXIS ------------------------------------//
        // Check if left leg is extended
        let leftLegEnd = skeleton.getBoneByName(leftLegEndName); // foot
        let leftLegBase = leftLegEnd.parent; // knee
        parent = leftLegBase.parent; // up-leg
        
        let leftLegBasePos = leftLegBase.getWorldPosition(new THREE.Vector3());
        let parentPos = parent.getWorldPosition(new THREE.Vector3());  

        // Compute up leg direction (up-leg-to-knee)
        let leftLegBaseDir = new THREE.Vector3(); 
        leftLegBaseDir.subVectors(leftLegBasePos, parentPos).normalize();
        this.alignBoneToAxis(leftLegBase, leftLegBaseDir);

        // Check if left leg follow the -Y axis
        let up = new THREE.Vector3(0, -1, 0);
        leftLegBase = skeleton.getBoneByName(leftLegBaseName);
        leftLegEnd = skeleton.getBoneByName(leftLegEndName);

        this.alignBoneToAxis(leftLegBase, up, leftLegEnd);
        
        // Check if left leg is extended
        let rightLegEnd = skeleton.getBoneByName(rightLegEndName); // foot
        let rightLegBase = rightLegEnd.parent; // knee
        parent = rightLegBase.parent; // up-leg
        
        let rightLegBasePos = rightLegBase.getWorldPosition(new THREE.Vector3());
        parentPos = parent.getWorldPosition(new THREE.Vector3());  

        // Compute up arm direction (up-leg-to-knee)
        let rightLegBaseDir = new THREE.Vector3(); 
        rightLegBaseDir.subVectors(rightLegBasePos, parentPos).normalize();
        this.alignBoneToAxis(rightLegBase, rightLegBaseDir);
        // Check if right leg follow the -Y axis
        rightLegBase = skeleton.getBoneByName(rightLegBaseName);
        rightLegEnd = skeleton.getBoneByName(rightLegEndName);

        this.alignBoneToAxis(rightLegBase, up, rightLegEnd);

        //------------------------------------ ARMS COMPLETLY EXTENDED AND ALIGNED TO X-AXIS ------------------------------------//
        //LEFT
        // Check if left arm is extended
        let leftArmEnd = skeleton.getBoneByName(leftArmEndName); // hand
        let leftArmBase = leftArmEnd.parent; // elbow
        parent = leftArmBase.parent; // shoulder
        
        let leftArmBasePos = leftArmBase.getWorldPosition(new THREE.Vector3());
        parentPos = parent.getWorldPosition(new THREE.Vector3());  

        // Compute up arm direction (shoulder-to-elbow)
        let leftArmBaseDir = new THREE.Vector3(); 
        leftArmBaseDir.subVectors(leftArmBasePos, parentPos).normalize();

        this.alignBoneToAxis(leftArmBase, leftArmBaseDir);
   
        // Check if left arm follow the +X axis
        let xAxis = new THREE.Vector3(1, 0, 0);
        leftArmBase = skeleton.getBoneByName(leftArmBaseName);
        this.alignBoneToAxis(leftArmBase, xAxis);

        //RIGHT
       // Check if right arm is extended
        let rightArmEnd = skeleton.getBoneByName(rightArmEndName); // hand
        let rightArmBase = rightArmEnd.parent; // elbow
        parent = rightArmBase.parent; // shoulder
        
        let rightArmBasePos = rightArmBase.getWorldPosition(new THREE.Vector3());
        parentPos = parent.getWorldPosition(new THREE.Vector3());  

        // Compute up arm direction (shoulder-to-elbow)
        let rightArmBaseDir = new THREE.Vector3(); 
        rightArmBaseDir.subVectors(rightArmBasePos, parentPos).normalize();
        this.alignBoneToAxis(rightArmBase, rightArmBaseDir);    
        
        // Check if right arm follow the -X axis
        xAxis.set(-1, 0, 0);
        rightArmBase = skeleton.getBoneByName(rightArmBaseName);
        this.alignBoneToAxis(rightArmBase, xAxis);
    
        return skeleton;
    }

    /**
     * Rotate the given bone in order to be aligned with the specified axis
     * @param {THREE.Bone} bone 
     * @param {THREE.Vector3} axis 
     */
    alignBoneToAxis(bone, axis, child) {
        bone.updateMatrixWorld(true, true);
        // Get global positions
        const bonePos = bone.getWorldPosition(new THREE.Vector3());
        const childPos = child ? child.getWorldPosition(new THREE.Vector3()) : bone.children[0].getWorldPosition(new THREE.Vector3());        
        
        // Compute the unitary direction of the bone from its position and its child position
        let dir = new THREE.Vector3();
        dir.subVectors(childPos, bonePos).normalize();
        
        // Compute angle (rad) between the bone direction and the axis
        let angle = (dir).angleTo(axis);
        if(Math.abs(angle) > 0.001) {
            // Compute the perpendicular unitary axis between the directions
            let perpVector = new THREE.Vector3();
            perpVector.crossVectors(axis, dir).normalize();
            let rot = new THREE.Quaternion().setFromAxisAngle(perpVector, -angle);
            // Get bone global rotation 
            let boneRot = bone.getWorldQuaternion(new THREE.Quaternion());
            // Apply computed rotation to the bone global rotation
            boneRot = boneRot.premultiply(rot);
            
            if (bone.parent) {
                let parent = bone.parent;
                let boneParentRot = parent.getWorldQuaternion(new THREE.Quaternion());
                // Convert new bone global rotation to local rotation and set to the it
                bone.quaternion.copy(boneRot.premultiply(boneParentRot.invert()));
                // Update bone matrix and children matrices
                bone.updateMatrix();
                bone.updateMatrixWorld(false, true);
            }
        }
    }

    precomputeRetargetingPosition(){
        // Asumes the first bone in the skeleton is the root
        const srcBoneIndex = 0;    
        const trgBoneIndex = this.boneMap.idxMap[ srcBoneIndex ] ;    
        if ( trgBoneIndex < 0 ){
            return null;
        } 
         
        // Computes the position difference between the roots (Hip bone)
        const srcPosition = this.srcBindPose.bones[srcBoneIndex].getWorldPosition(new THREE.Vector3());
        const trgPosition = this.trgBindPose.bones[trgBoneIndex].getWorldPosition(new THREE.Vector3());
        let offset =  new THREE.Vector3();
        offset.subVectors(trgPosition, srcPosition);

        return offset;
    }

    precomputeRetargetingQuats(){
        //BASIC ALGORITHM --> trglocal = invBindTrgWorldParent * bindSrcWorldParent * srcLocal * invBindSrcWorld * bindTrgWorld
        // trglocal = invBindTrgWorldParent * invTrgEmbedded * srcEmbedded * bindSrcWorldParent * srcLocal * invBindSrcWorld * invSrcEmbedded * trgEmbedded * bindTrgWorld

        let left = new Array( this.srcBindPose.bones.length ); // invBindTrgWorldParent * invTrgEmbedded * srcEmbedded * bindSrcWorldParent
        let right = new Array( this.srcBindPose.bones.length ); // invBindSrcWorld * invSrcEmbedded * trgEmbedded * bindTrgWorld
        
        for( let srcIndex = 0; srcIndex < left.length; ++srcIndex ){
            let trgIndex = this.boneMap.idxMap[ srcIndex ];
            if( trgIndex < 0 ){ // not mapped, cannot precompute
                left[ srcIndex ] = null;
                right[ srcIndex ] = null;
                continue;
            }

            let resultQuat = new THREE.Quaternion(0,0,0,1);
            resultQuat.copy( this.trgBindPose.transformsWorld[ trgIndex ].q ); // bindTrgWorld
            if ( this.trgBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.trgBindPose.transformsWorldEmbedded.forward.q ); } // trgEmbedded
            if ( this.srcBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.srcBindPose.transformsWorldEmbedded.inverse.q ); } // invSrcEmbedded
            resultQuat.premultiply( this.srcBindPose.transformsWorldInverses[ srcIndex ].q ); // invBindSrcWorld
            right[ srcIndex ] = resultQuat;

            resultQuat = new THREE.Quaternion(0,0,0,1);
            // bindSrcWorldParent
            if ( this.srcBindPose.bones[ srcIndex ].parent ){ 
                let parentIdx = this.srcBindPose.parentIndices[ srcIndex ];
                resultQuat.premultiply( this.srcBindPose.transformsWorld[ parentIdx ].q ); 
            }

            if ( this.srcBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.srcBindPose.transformsWorldEmbedded.forward.q ); } // srcEmbedded
            if ( this.trgBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.trgBindPose.transformsWorldEmbedded.inverse.q ); } // invTrgEmbedded

            // invBindTrgWorldParent
            if ( this.trgBindPose.bones[ trgIndex ].parent ){ 
                let parentIdx = this.trgBindPose.parentIndices[ trgIndex ];
                resultQuat.premultiply( this.trgBindPose.transformsWorldInverses[ parentIdx ].q ); 
            } 
            left[ srcIndex ] = resultQuat
        }
        
        return { left: left, right: right };
    }

    /**
     * retargets the bone specified
     * @param {int} srcIndex MUST be a valid MAPPED bone. Otherwise it crashes
     * @param {THREE.Quaternion} srcLocalQuat 
     * @param {THREE.Quaternion} resultQuat if null, a new THREE.Quaternion is created
     * @returns resultQuat
     */
    _retargetQuaternion( srcIndex, srcLocalQuat, resultQuat = null ){
        if ( !resultQuat ){ resultQuat = new THREE.Quaternion(0,0,0,1); }
        //BASIC ALGORITHM --> trglocal = invBindTrgWorldParent * bindSrcWorldParent * srcLocal * invBindSrcWorld * bindTrgWorld
        // trglocal = invBindTrgWorldParent * invTrgEmbedded * srcEmbedded * bindSrcWorldParent * srcLocal * invBindSrcWorld * invSrcEmbedded * trgEmbedded * bindTrgWorld
        
        // In this order because resultQuat and srcLocalQuat might be the same Quaternion instance
        resultQuat.copy( srcLocalQuat ); // srcLocal
        resultQuat.premultiply( this.precomputedQuats.left[ srcIndex ] ); // invBindTrgWorldParent * invTrgEmbedded * srcEmbedded * bindSrcWorldParent
        resultQuat.multiply( this.precomputedQuats.right[ srcIndex ] ); // invBindSrcWorld * invSrcEmbedded * trgEmbedded * bindTrgWorld
        return resultQuat;
    }

    /**
     * Retargets the current whole (mapped) skeleton pose.
     * Currently, only quaternions are retargeted 
     */
    retargetPose(){      
        
        let m = this.boneMap.idxMap;        
        for ( let i = 0; i < m.length; ++i ){
            if ( m[i] < 0 ){ continue; }
            this._retargetQuaternion( i, this.srcSkeleton.bones[ i ].quaternion, this.trgSkeleton.bones[ m[i] ].quaternion );
        }
    }

    /**
     * 
     * assumes srcTrack IS a position track (VectorKeyframeTrack) with the proper values array and name (boneName.scale) 
     * @param {THREE.VectorKeyframeTrack} srcTrack 
     * @returns {THREE.VectorKeyframeTrack}
     */
    retargetPositionTrack( srcTrack ){
        let boneName = srcTrack.name.slice(0, srcTrack.name.length - 9 ); // remove the ".position"
        let boneIndex = findIndexOfBoneByName( this.srcSkeleton, boneName );
        if ( boneIndex < 0 || this.boneMap.idxMap[ boneIndex ] < 0 ){
            return null;
        } 
        // Retargets the root bone posiiton
        let srcValues = srcTrack.values;
        let trgValues = new Float32Array( srcValues.length );
        if( boneIndex == 0 ) { // asume the first bone is the root

            let trgBindPos = this.trgBindPose.bones[boneIndex].getWorldPosition(new THREE.Vector3());
            let srcBindPos = this.srcBindPose.bones[boneIndex].getWorldPosition(new THREE.Vector3());
            let srcLocalScale = this.srcBindPose.bones[boneIndex].getWorldScale(new THREE.Vector3());
            // Scale the position with the global scale of the bone (in case the bind pose it's scaled)
            srcBindPos.divide(srcLocalScale);
			
			// Check that the division is not done with a 0
			srcBindPos.x = Math.abs(srcBindPos.x) <= 1e-6 ? 0.0 : srcBindPos.x;
			srcBindPos.y = Math.abs(srcBindPos.y) <= 1e-6 ? 0.0 : srcBindPos.y;
			srcBindPos.z = Math.abs(srcBindPos.z) <= 1e-6 ? 0.0 : srcBindPos.z;
			let targetPos = trgBindPos;
			targetPos.x = Math.abs(targetPos.x) <= 1e-6 ? 0.0 : targetPos.x;
			targetPos.y = Math.abs(targetPos.y) <= 1e-6 ? 0.0 : targetPos.y;
			targetPos.z = Math.abs(targetPos.z) <= 1e-6 ? 0.0 : targetPos.z;

			// Compute scale = target / source to get the difference of the scale
			let diffScale = new THREE.Vector3();
			diffScale.x = srcBindPos.x == 0.0 ? 0.0 : Math.abs(targetPos.x / srcBindPos.x);
			diffScale.y = srcBindPos.y == 0.0 ? 0.0 : Math.abs(targetPos.y / srcBindPos.y);
			diffScale.z = srcBindPos.z == 0.0 ? 0.0 : Math.abs(targetPos.z / srcBindPos.z);
						
            const offset = this.precomputedPosition;
            let pos = new THREE.Vector3();

            for( let i = 0; i < srcValues.length; i+=3 ){
                
                pos.set( srcValues[i], srcValues[i+1], srcValues[i+2]);
                let diffPosition = new THREE.Vector3();
                diffPosition.subVectors(pos, srcBindPos);
                // Scale the animation difference position with the scale diff between source and target and add it to the the Target Bind Position of the bone
			    diffPosition.multiplyScalar(diffScale.y).add(trgBindPos);
                
                if(this.trgBindPose.bones[this.boneMap.idxMap[ boneIndex ] ].parent) { // Convert to local space
                    //this.trgBindPose.bones[this.boneMap.idxMap[ boneIndex ] ].worldToLocal(diffPosition); // WRONG
                }
                trgValues[i]   = diffPosition.x ;
                trgValues[i+1] = diffPosition.y ;
                trgValues[i+2] = diffPosition.z ;            
            }
            // for( let i = 0; i < srcValues.length; i+=3 ){
                
            //     pos.set( srcValues[i], srcValues[i+1], srcValues[i+2]);
                
            //     trgValues[i]   = pos.x + offset.x ;
            //     trgValues[i+1] = pos.y + offset.y ;
            //     trgValues[i+2] = pos.z + offset.z ;            
            // }
            
        }
        // TODO missing interpolation mode. Assuming always linear. Also check if arrays are copied or referenced
        return new THREE.VectorKeyframeTrack( this.boneMap.nameMap[ boneName ] + ".position", srcTrack.times, trgValues ); 
    }
    
    /**
     * assumes srcTrack IS a quaternion track with the proper values array and name (boneName.quaternion) 
     * @param {THREE.QuaternionKeyframeTrack} srcTrack 
     * @returns {THREE.QuaternionKeyframeTrack}
     */
    retargetQuaternionTrack( srcTrack ){
        let boneName = srcTrack.name.slice(0, srcTrack.name.length - 11 ); // remove the ".quaternion"
        let boneIndex = findIndexOfBoneByName( this.srcSkeleton, boneName );
        if ( boneIndex < 0 || this.boneMap.idxMap[ boneIndex ] < 0 ){
            return null;
        } 

        let quat = new THREE.Quaternion( 0,0,0,1 );
        let srcValues = srcTrack.values;
        let trgValues = new Float32Array( srcValues.length );
        for( let i = 0; i < srcValues.length; i+=4 ){
            quat.set( srcValues[i], srcValues[i+1], srcValues[i+2], srcValues[i+3] );
            this._retargetQuaternion( boneIndex, quat, quat );
            trgValues[i] = quat.x;
            trgValues[i+1] = quat.y;
            trgValues[i+2] = quat.z;
            trgValues[i+3] = quat.w;
        }

        // TODO missing interpolation mode. Assuming always linear
        return new THREE.QuaternionKeyframeTrack( this.boneMap.nameMap[ boneName ] + ".quaternion", srcTrack.times, trgValues ); 
    }

    /**
     * NOT IMPLEMENTEED
     * assumes srcTrack IS a scale track (VectorKeyframeTrack) with the proper values array and name (boneName.scale) 
     * @param {THREE.VectorKeyframeTrack} srcTrack 
     * @returns {THREE.VectorKeyframeTrack}
     */
    retargetScaleTrack( srcTrack ){
        let boneName = srcTrack.name.slice(0, srcTrack.name.length - 6 ); // remove the ".scale"
        let boneIndex = findIndexOfBoneByName( this.srcSkeleton, boneName );
        if ( boneIndex < 0 || this.boneMap.idxMap[ boneIndex ] < 0 ){
            return null;
        } 
        // TODO

        // TODO missing interpolation mode. Assuming always linear. Also check if arrays are copied or referenced
        return new THREE.VectorKeyframeTrack( this.boneMap.nameMap[ boneName ] + ".scale", srcTrack.times, srcTrack.values ); 
    }

    /**
     * Given a clip, all tracks with a mapped bone are retargeted.
     * Currently only quaternions are retargeted
     * @param {THREE.AnimationClip} anim 
     * @returns {THREE.AnimationClip}
     */
    retargetAnimation( anim ){
        let trgTracks = [];
        let srcTracks = anim.tracks;
        for( let i = 0; i < srcTracks.length; ++i ){
            let t = srcTracks[i];
            let newTrack = null;
            if ( t.name.endsWith( ".position" ) ){ newTrack = this.retargetPositionTrack( t ); } // ignore for now
            else if ( t.name.endsWith( ".quaternion" ) ){ newTrack = this.retargetQuaternionTrack( t ); }
            else if ( t.name.endsWith( ".scale" ) ){ newTrack = this.retargetScaleTrack( t ); } // ignore for now

            if ( newTrack ){ trgTracks.push( newTrack ); }
        } 

        // negative duration: automatically computes proper duration of animation based on tracks
        return new THREE.AnimationClip( anim.name, -1, trgTracks, anim.blendMode ); 
    }
}

// ---- HELPERS ----
// should be moved into a "utils" file 

// O(n)
function findIndexOfBone( skeleton, bone ){
    if ( !bone ){ return -1;}
    let b = skeleton.bones;
    for( let i = 0; i < b.length; ++i ){
        if ( b[i] == bone ){ return i; }
    }
    return -1;
}

// O(nm)
function findIndexOfBoneByName( skeleton, name ){
    if ( !name ){ return -1; }
    let b = skeleton.bones;
    for( let i = 0; i < b.length; ++i ){
        if ( b[i].name == name ){ return i; }
    }
    return -1;
}

// sets bind quaternions only. Warning: Not the best function to call every frame.
function forceBindPoseQuats( skeleton, skipRoot = false ){
    let bones = skeleton.bones;
    let inverses = skeleton.boneInverses;
    if ( inverses.length < 1 ){ return; }
    let boneMat = inverses[0].clone(); 
    let _ignoreVec3 = new THREE.Vector3();
    for( let i = 0; i < bones.length; ++i ){
        boneMat.copy( inverses[i] ); // World to Local
        boneMat.invert(); // Local to World

        // get only the local matrix of the bone (root should not need any change)
        let parentIdx = findIndexOfBone( skeleton, bones[i].parent );
        if ( parentIdx > -1 ){ boneMat.premultiply( inverses[ parentIdx ] ); }
        else{
            if ( skipRoot ){ continue; }
        }
       
        boneMat.decompose( _ignoreVec3, bones[i].quaternion, _ignoreVec3 );
        // bones[i].quaternion.setFromRotationMatrix( boneMat );
        bones[i].quaternion.normalize(); 
    }
}

export { AnimationRetargeting, findIndexOfBone, findIndexOfBoneByName, forceBindPoseQuats };