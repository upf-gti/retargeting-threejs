import * as THREE from 'three';
//import { normalize } from 'three/src/math/MathUtils.js';


// asymetric and/or negative scaling of objects is not properly supported 
class AnimationRetargeting {

    /**
    * @DEFAULT Uses skeleton's actual bind pose
    * @CURRENT Uses skeleton's current pose
    * @TPOSE Forces the skeleton's current pose to T-pose and uses skeleton's current pose
    */
    static BindPoseModes = { DEFAULT : 0, CURRENT: 1}
    static boneMap = {
        "Hips":			  "hips",
        "BelowStomach":   "spine",
        "Stomach":  	  "spine1",
        "ShouldersUnion": "spine2", // chest
        "Neck":           "neck",
        "Head":           "head",
        "LEye":           "lefteye",
        "REye":           "righteye",
        "LShoulder":      "leftshoulder",
        "LArm":           "leftarm",
        "LElbow":         "leftforearm",
        "LWrist":         "lefthand",
        "LHandThumb":     "lefthandthumb1",
        "LHandThumb2":    "lefthandthumb2",
        "LHandThumb3":    "lefthandthumb3",
        "LHandThumb4":    "lefthandthumb4",
        "LHandIndex":     "lefthandindex1",
        "LHandIndex2":    "lefthandindex2",
        "LHandIndex3":    "lefthandindex3",
        "LHandIndex4":    "lefthandindex4",
        "LHandMiddle":    "lefthandmiddle1",
        "LHandMiddle2":   "lefthandmiddle2",
        "LHandMiddle3":   "lefthandmiddle3",
        "LHandMiddle4":   "lefthandmiddle4",
        "LHandRing":      "lefthandring1",
        "LHandRing2":     "lefthandring2",
        "LHandRing3":     "lefthandring3",
        "LHandRing4":     "lefthandring4",
        "LHandPinky":     "lefthandpinky1",
        "LHandPinky2":    "lefthandpinky2",
        "LHandPinky3":    "lefthandpinky3",
        "LHandPinky4":    "lefthandpinky4",
        "RShoulder":      "rightshoulder",
        "RArm":           "rightarm",
        "RElbow":         "rightforearm",
        "RWrist":         "righthand",
        "RHandThumb":     "righthandthumb1",
        "RHandThumb2":    "righthandthumb2",
        "RHandThumb3":    "righthandthumb3",
        "RHandThumb4":    "righthandthumb4",
        "RHandIndex":     "righthandindex1",
        "RHandIndex2":    "righthandindex2",
        "RHandIndex3":    "righthandindex3",
        "RHandIndex4":    "righthandindex4",
        "RHandMiddle":    "righthandmiddle1",
        "RHandMiddle2":   "righthandmiddle2",
        "RHandMiddle3":   "righthandmiddle3",
        "RHandMiddle4":   "righthandmiddle4",
        "RHandRing":      "righthandring1",
        "RHandRing2":     "righthandring2",
        "RHandRing3":     "righthandring3",
        "RHandRing4":     "righthandring4",
        "RHandPinky":     "righthandpinky1",
        "RHandPinky2":    "righthandpinky2",
        "RHandPinky3":    "righthandpinky3",
        "RHandPinky4":    "righthandpinky4",
        "LUpLeg":         "leftupleg",
        "LLeg":           "leftleg",
        "LFoot":          "leftfoot",
        "RUpLeg":         "rightupleg",
        "RLeg":           "rightleg",
        "RFoot":          "rightfoot",
    };

    static boneHierarchy = {
        "LEye":           6,
        "REye":           6,
        "Head":           5,
        "Neck":           4,
        "ShouldersUnion": 3, // chest
        "Stomach":  	  2,
        "BelowStomach":   1,
        "Hips":			  0,
        "RShoulder":      4,
        "RArm":           5,
        "RElbow":         6,
        "RWrist":         7,
        "RHandThumb":     8,
        "RHandThumb2":    9,
        "RHandThumb3":    10,
        "RHandThumb4":    11,
        "RHandIndex":     8,
        "RHandIndex2":    9,
        "RHandIndex3":    10,
        "RHandIndex4":    11,
        "RHandMiddle":    8,
        "RHandMiddle2":   9,
        "RHandMiddle3":   10,
        "RHandMiddle4":   11,
        "RHandRing":      8,
        "RHandRing2":     9,
        "RHandRing3":     10,
        "RHandRing4":     11,
        "RHandPinky":     8,
        "RHandPinky2":    9,
        "RHandPinky3":    10,
        "RHandPinky4":    11,
        "LShoulder":      4,
        "LArm":           5,
        "LElbow":         6,
        "LWrist":         7,
        "LHandThumb":     8,
        "LHandThumb2":    9,
        "LHandThumb3":    10,
        "LHandThumb4":    11,
        "LHandIndex":     8,
        "LHandIndex2":    9,
        "LHandIndex3":    10,
        "LHandIndex4":    11,
        "LHandMiddle":    8,
        "LHandMiddle2":   9,
        "LHandMiddle3":   10,
        "LHandMiddle4":   11,
        "LHandRing":      8,
        "LHandRing2":     9,
        "LHandRing3":     10,
        "LHandRing4":     11,
        "LHandPinky":     8,
        "LHandPinky2":    9,
        "LHandPinky3":    10,
        "LHandPinky4":    11,
        "LUpLeg":         1,
        "LLeg":           2,
        "LFoot":          3,
        "RUpLeg":         1,
        "RLeg":           2,
        "RFoot":          3,
    };

    static standardBones = () => {
        const Hips = new THREE.Bone();
        Hips.name = "Hips";
        const BelowStomach = new THREE.Bone();
        BelowStomach.name = "BelowStomach";
        const Stomach = new THREE.Bone();
        Stomach.name = "Stomach";
        const ShouldersUnion = new THREE.Bone();
        ShouldersUnion.name = "ShouldersUnion";
        const Neck = new THREE.Bone();
        Neck.name = "Neck";
        const Head = new THREE.Bone();
        Head.name = "Head";
        const LEye = new THREE.Bone();
        LEye.name = "LEye";
        const REye = new THREE.Bone();
        REye.name = "REye";
        const LShoulder = new THREE.Bone();
        LShoulder.name = "LShoulder";
        const LArm = new THREE.Bone();
        LArm.name = "LArm";
        const LElbow = new THREE.Bone();
        LElbow.name = "LElbow";
        const LWrist = new THREE.Bone();
        LWrist.name = "LWrist";
        const LHandThumb = new THREE.Bone();
        LHandThumb.name = "LHandThumb";
        const LHandThumb2 = new THREE.Bone();
        LHandThumb2.name = "LHandThumb2";
        const LHandThumb3 = new THREE.Bone();
        LHandThumb3.name = "LHandThumb3";
        const LHandThumb4 = new THREE.Bone();
        LHandThumb4.name = "LHandThumb4";
        const LHandIndex = new THREE.Bone();
        LHandIndex.name = "LHandIndex";
        const LHandIndex2 = new THREE.Bone();
        LHandIndex2.name = "LHandIndex2";
        const LHandIndex3 = new THREE.Bone();
        LHandIndex3.name = "LHandIndex3";
        const LHandIndex4 = new THREE.Bone();
        LHandIndex4.name = "LHandIndex4";
        const LHandMiddle = new THREE.Bone();
        LHandMiddle.name = "LHandMiddle";
        const LHandMiddle2 = new THREE.Bone();
        LHandMiddle2.name = "LHandMiddle2";
        const LHandMiddle3 = new THREE.Bone();
        LHandMiddle3.name = "LHandMiddle3";
        const LHandMiddle4 = new THREE.Bone();
        LHandMiddle4.name = "LHandMiddle4";
        const LHandRing = new THREE.Bone();
        LHandRing.name = "LHandRing";
        const LHandRing2 = new THREE.Bone();
        LHandRing2.name = "LHandRing2";
        const LHandRing3 = new THREE.Bone();
        LHandRing3.name = "LHandRing3";
        const LHandRing4 = new THREE.Bone();
        LHandRing4.name = "LHandRing4";
        const LHandPinky = new THREE.Bone();
        LHandPinky.name = "LHandPinky";
        const LHandPinky2 = new THREE.Bone();
        LHandPinky2.name = "LHandPinky2";
        const LHandPinky3 = new THREE.Bone();
        LHandPinky3.name = "LHandPinky3";
        const LHandPinky4 = new THREE.Bone();
        LHandPinky4.name = "LHandPinky4";
        const RShoulder = new THREE.Bone();
        RShoulder.name = "RShoulder";
        const RArm = new THREE.Bone();
        RArm.name = "RArm";
        const RElbow = new THREE.Bone();
        RElbow.name = "RElbow";
        const RWrist = new THREE.Bone();
        RWrist.name = "RWrist";
        const RHandThumb = new THREE.Bone();
        RHandThumb.name = "RHandThumb";
        const RHandThumb2 = new THREE.Bone();
        RHandThumb2.name = "RHandThumb2";
        const RHandThumb3 = new THREE.Bone();
        RHandThumb3.name = "RHandThumb3";
        const RHandThumb4 = new THREE.Bone();
        RHandThumb4.name = "RHandThumb4";
        const RHandIndex = new THREE.Bone();
        RHandIndex.name = "RHandIndex";
        const RHandIndex2 = new THREE.Bone();
        RHandIndex2.name = "RHandIndex2";
        const RHandIndex3 = new THREE.Bone();
        RHandIndex3.name = "RHandIndex3";
        const RHandIndex4 = new THREE.Bone();
        RHandIndex4.name = "RHandIndex4";
        const RHandMiddle = new THREE.Bone();
        RHandMiddle.name = "RHandMiddle";
        const RHandMiddle2 = new THREE.Bone();
        RHandMiddle2.name = "RHandMiddle2";
        const RHandMiddle3 = new THREE.Bone();
        RHandMiddle3.name = "RHandMiddle3";
        const RHandMiddle4 = new THREE.Bone();
        RHandMiddle4.name = "RHandMiddle4";
        const RHandRing = new THREE.Bone();
        RHandRing.name = "RHandRing";
        const RHandRing2 = new THREE.Bone();
        RHandRing2.name = "RHandRing2";
        const RHandRing3 = new THREE.Bone();
        RHandRing3.name = "RHandRing3";
        const RHandRing4 = new THREE.Bone();
        RHandRing4.name = "RHandRing4";
        const RHandPinky = new THREE.Bone();
        RHandPinky.name = "RHandPinky";
        const RHandPinky2 = new THREE.Bone();
        RHandPinky2.name = "RHandPinky2";
        const RHandPinky3 = new THREE.Bone();
        RHandPinky3.name = "RHandPinky3";
        const RHandPinky4 = new THREE.Bone();
        RHandPinky4.name = "RHandPinky4";
        const LUpLeg = new THREE.Bone();
        LUpLeg.name = "LUpLeg";
        const LLeg = new THREE.Bone();
        LLeg.name = "LLeg";
        const LFoot = new THREE.Bone();
        LFoot.name = "LFoot";
        const RUpLeg = new THREE.Bone();
        RUpLeg.name = "RUpLeg";
        const RLeg = new THREE.Bone();
        RLeg.name = "RLeg";
        const RFoot = new THREE.Bone();
        RFoot.name = "RFoot";

        Hips.add(BelowStomach);

        BelowStomach.add(Stomach);
        Stomach.add(ShouldersUnion);

        ShouldersUnion.add(Neck);
        ShouldersUnion.add(LShoulder)
        ShouldersUnion.add(RShoulder);
        
        Neck.add(Head);
        Head.add(LEye);
        Head.add(REye);

        LShoulder.add(LArm);
        LArm.add(LElbow);
        LElbow.add(LWrist);

        LWrist.add(LHandThumb);
        LWrist.add(LHandIndex);
        LWrist.add(LHandMiddle);
        LWrist.add(LHandRing);
        LWrist.add(LHandPinky);

        LHandThumb.add(LHandThumb2);
        LHandThumb2.add(LHandThumb3);
        LHandThumb3.add(LHandThumb4);

        LHandIndex.add(LHandIndex2);
        LHandIndex2.add(LHandIndex3);
        LHandIndex3.add(LHandIndex4);

        LHandMiddle.add(LHandMiddle2);
        LHandMiddle2.add(LHandMiddle3);
        LHandMiddle3.add(LHandMiddle4);

        LHandRing.add(LHandRing2);
        LHandRing2.add(LHandRing3);
        LHandRing3.add(LHandRing4);

        LHandPinky.add(LHandPinky2);
        LHandPinky2.add(LHandPinky3);
        LHandPinky3.add(LHandPinky4);

        RShoulder.add(RArm);
        RArm.add(RElbow);
        RElbow.add(RWrist);

        RWrist.add(RHandThumb);
        RWrist.add(RHandIndex);
        RWrist.add(RHandMiddle);
        RWrist.add(RHandRing);
        RWrist.add(RHandPinky);

        RHandThumb.add(RHandThumb2);
        RHandThumb2.add(RHandThumb3);
        RHandThumb3.add(RHandThumb4);

        RHandIndex.add(RHandIndex2);
        RHandIndex2.add(RHandIndex3);
        RHandIndex3.add(RHandIndex4);

        RHandMiddle.add(RHandMiddle2);
        RHandMiddle2.add(RHandMiddle3);
        RHandMiddle3.add(RHandMiddle4);

        RHandRing.add(RHandRing2);
        RHandRing2.add(RHandRing3);
        RHandRing3.add(RHandRing4);

        RHandPinky.add(RHandPinky2);
        RHandPinky2.add(RHandPinky3);
        RHandPinky3.add(RHandPinky4);

        Hips.add(LUpLeg);
        LUpLeg.add(LLeg);
        LLeg.add(LFoot);

        Hips.add(RUpLeg);
        RUpLeg.add(RLeg);
        RLeg.add(RFoot);

        return [ Hips, BelowStomach, Stomach, ShouldersUnion, Neck, Head, LEye, REye, LShoulder, LArm, LElbow, LWrist, LHandThumb, LHandThumb2, LHandThumb3, LHandThumb4, LHandIndex, LHandIndex2, LHandIndex3, LHandIndex4, LHandMiddle, LHandMiddle2, LHandMiddle3, LHandMiddle4, LHandRing, LHandRing2, LHandRing3, LHandRing4, LHandPinky, LHandPinky2, LHandPinky3, LHandPinky4, RShoulder, RArm, RElbow, RWrist, RHandThumb, RHandThumb2, RHandThumb3, RHandThumb4, RHandIndex, RHandIndex2, RHandIndex3, RHandIndex4, RHandMiddle, RHandMiddle2, RHandMiddle3, RHandMiddle4, RHandRing, RHandRing2, RHandRing3, RHandRing4, RHandPinky, RHandPinky2, RHandPinky3, RHandPinky4, LUpLeg, LLeg, LFoot, RUpLeg, RLeg, RFoot ];
    
    }
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
    constructor( srcSkeleton, trgSkeleton, options = {} ){

        this.srcSkeleton = srcSkeleton; // original ref
        if ( !srcSkeleton.boneInverses ){ // find its skeleton
            srcSkeleton.traverse( (o) => { if( o.isSkinnedMesh ){ this.srcSkeleton = o.skeleton; } } );
        }
        this.trgSkeleton = trgSkeleton; // original ref
        if ( !trgSkeleton.boneInverses ){ // find its skeleton
            trgSkeleton.traverse( (o) => { if( o.isSkinnedMesh ){ this.trgSkeleton = o.skeleton; } } );
        }        

        this.boneMap = this.computeBoneMap( this.srcSkeleton, this.trgSkeleton, options.boneNameMap ); // { idxMap: [], nameMape:{} }
        this.srcBindPose = this.cloneRawSkeleton( this.srcSkeleton, options.srcPoseMode, options.srcEmbedWorldTransforms ); // returns pure skeleton, without any object model applied 
        this.trgBindPose = this.cloneRawSkeleton( this.trgSkeleton, options.trgPoseMode, options.trgEmbedWorldTransforms ); // returns pure skeleton, without any object model applied

        this.precomputedQuats = this.precomputeRetargetingQuats();
        this.proportionRatio = this.computeProportionRatio(); // returns an aproximate ratio of lengths between source skeleton and target skeleton
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
            case AnimationRetargeting.BindPoseModes.CURRENT: 
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
        if ( boneMap ) {
            for ( let srcName in boneMap ){
                let idx = findIndexOfBoneByName( srcSkeleton, srcName );    
                if ( idx < 0 ){ continue; }
                let trgIdx = findIndexOfBoneByName( trgSkeleton, boneMap[ srcName ] ); // will return either a valid index or -1
                result.idxMap[ idx ] = trgIdx;
                result.nameMap[ srcName ] = boneMap[ srcName ];
            }
        }
        else {
            // automap
            const auxBoneMap = Object.keys(AnimationRetargeting.boneMap);
            const srcBoneMap = computeAutoBoneMap( srcSkeleton );
            const trgBoneMap = computeAutoBoneMap( trgSkeleton );
            if(srcBoneMap.idxMap.length && trgBoneMap.idxMap.length) {
                for(let i = 0; i < auxBoneMap.length; i++) {           
                    const name = auxBoneMap[i];
                    if(srcBoneMap.idxMap[i] < 0) {
                        continue;
                    }
                    result.idxMap[srcBoneMap.idxMap[i]] = trgBoneMap.idxMap[i];
                    result.nameMap[ srcBoneMap.nameMap[name]] = trgBoneMap.nameMap[name]; 
                }
                result.srcBoneMap = srcBoneMap;
                result.trgBoneMap = trgBoneMap;
            }
        }

        return result
    }

    /**
    * Computes an aproximate ratio of lengths between source skeleton and target skeleton
    */
    computeProportionRatio(){
        let srcLength = 0;        
        // Compute source sum of bone lengths
        for(let i = 1; i < this.srcBindPose.bones.length; i++) {
            let dist = this.srcBindPose.bones[i].getWorldPosition(new THREE.Vector3()).distanceTo(this.srcBindPose.bones[i].parent.getWorldPosition(new THREE.Vector3()))
            srcLength += dist;
        }

        let trgLength = 0;
        // Compute target sum of bone lengths
        for(let i = 1; i < this.trgBindPose.bones.length; i++) {
            let dist = this.trgBindPose.bones[i].getWorldPosition(new THREE.Vector3()).distanceTo(this.trgBindPose.bones[i].parent.getWorldPosition(new THREE.Vector3()))
            trgLength += dist;
        }        
        return trgLength / srcLength
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
            // if ( this.trgBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.trgBindPose.transformsWorldEmbedded.forward.q ); } // trgEmbedded
            // if ( this.srcBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.srcBindPose.transformsWorldEmbedded.inverse.q ); } // invSrcEmbedded
            // if ( this.trgBindPose.transformsWorldEmbedded && srcIndex == 0 ) { resultQuat.premultiply( this.trgBindPose.transformsWorldEmbedded.inverse.q ); } // trgEmbedded
            // if ( this.srcBindPose.transformsWorldEmbedded && srcIndex == 0 ) { resultQuat.premultiply( this.srcBindPose.transformsWorldEmbedded.forward.q ); } // invSrcEmbedded
            resultQuat.premultiply( this.srcBindPose.transformsWorldInverses[ srcIndex ].q ); // invBindSrcWorld
            right[ srcIndex ] = resultQuat;

            resultQuat = new THREE.Quaternion(0,0,0,1);
            // bindSrcWorldParent
            if ( this.srcBindPose.bones[ srcIndex ].parent ){ 
                let parentIdx = this.srcBindPose.parentIndices[ srcIndex ];
                resultQuat.premultiply( this.srcBindPose.transformsWorld[ parentIdx ].q ); 
            }

            // if ( this.srcBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.srcBindPose.transformsWorldEmbedded.forward.q ); } // srcEmbedded
            // if ( this.trgBindPose.transformsWorldEmbedded ) { resultQuat.premultiply( this.trgBindPose.transformsWorldEmbedded.inverse.q ); } // invTrgEmbedded
            if ( this.srcBindPose.transformsWorldEmbedded && srcIndex == 0) { resultQuat.premultiply( this.srcBindPose.transformsWorldEmbedded.forward.q ); } // srcEmbedded
            if ( this.trgBindPose.transformsWorldEmbedded && srcIndex == 0) { resultQuat.premultiply( this.trgBindPose.transformsWorldEmbedded.inverse.q ); } // invTrgEmbedded

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
            let srcCurrentPos = new THREE.Vector3();

            for( let i = 0; i < srcValues.length; i+=3 ){
                
                srcCurrentPos.set( srcValues[i], srcValues[i+1], srcValues[i+2]);
                let diffPosition = new THREE.Vector3().copy(srcBindPos);
                const ratio = trgBindPos.y/diffPosition.y

                if(this.srcBindPose.transformsWorldEmbedded) {
                srcCurrentPos.applyQuaternion(this.srcBindPose.transformsWorldEmbedded.forward.q);
                   srcCurrentPos.multiply(this.srcBindPose.transformsWorldEmbedded.forward.s);
                }
                if(this.trgBindPose.transformsWorldEmbedded) {
                    srcCurrentPos.applyQuaternion(this.trgBindPose.transformsWorldEmbedded.inverse.q);
                    srcCurrentPos.multiply(this.trgBindPose.transformsWorldEmbedded.inverse.s);
                }
                
                diffPosition.subVectors(srcCurrentPos, diffPosition);
                // Scale the animation difference position with the scale diff between source and target and add it to the the Target Bind Position of the bone
			    diffPosition.multiplyScalar(ratio).add(trgBindPos);

                trgValues[i]   = diffPosition.x;
                trgValues[i+1] = diffPosition.y;
                trgValues[i+2] = diffPosition.z;     
            }
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
     * assumes srcTrack IS a scale track (VectorKeyframeTrack) with the proper values array and name (boneName.scale) 
     * @param {THREE.VectorKeyframeTrack} srcTrack 
     * @returns {THREE.VectorKeyframeTrack}
     */
    retargetScaleTrack( srcTrack ){
        const boneName = srcTrack.name.slice(0, srcTrack.name.length - 6 ); // remove the ".scale"
        const boneIndex = findIndexOfBoneByName( this.srcSkeleton, boneName );
        if ( boneIndex < 0 || this.boneMap.idxMap[ boneIndex ] < 0 ){
            return null;
        } 
        const srcScale = this.srcBindPose.bones[boneIndex].scale;
        const trgScale = this.trgBindPose.bones[ this.boneMap.idxMap[ boneIndex ] ].scale;
        const scaleRatio = trgScale.clone().divide(srcScale);
        if(this.srcBindPose.transformsWorldEmbedded && boneIndex == 0) {
            scaleRatio.multiply(this.srcBindPose.transformsWorldEmbedded.forward.s);
        }
        if(this.trgBindPose.transformsWorldEmbedded && boneIndex == 0) {
            scaleRatio.multiply(this.trgBindPose.transformsWorldEmbedded.inverse.s);
        }
        const srcValues = srcTrack.values;
        let trgValues = new Float32Array( srcValues.length );
        for( let i = 0; i < srcValues.length; i+=3 ){
            trgValues[i] = srcValues[i] * scaleRatio.x;
            trgValues[i+1] = srcValues[i+1] * scaleRatio.y;
            trgValues[i+2] = srcValues[i+2] * scaleRatio.z;
        }


        // TODO missing interpolation mode. Assuming always linear. Also check if arrays are copied or referenced
        return new THREE.VectorKeyframeTrack( this.boneMap.nameMap[ boneName ] + ".scale", srcTrack.times.slice(), trgValues ); 
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
            if ( t.name.endsWith( ".position" ) && t.name.includes(this.srcSkeleton.bones[0].name) ){ newTrack = this.retargetPositionTrack( t ); } // ignore for now
            else if ( t.name.endsWith( ".quaternion" ) ){ newTrack = this.retargetQuaternionTrack( t ); }
            else if ( t.name.endsWith( ".scale" ) ){ newTrack = this.retargetScaleTrack( t ); } // ignore for now

            if ( newTrack ){ trgTracks.push( newTrack ); }
        } 

        // negative duration: automatically computes proper duration of animation based on tracks
        const trgAnim =  new THREE.AnimationClip( anim.name, -1, trgTracks, anim.blendMode );
        return trgAnim;
    }

    async applyIKPose(ikSolver) {
        const computeTargetLocation = ( chainName, referenceBone, xScale = 0) => {
                const chain = ikSolver.getChain(chainName);
                const scaleF = chain.length/chain.srcLength;
                const endEffector = this.srcSkeleton.bones[chain.chain[0]];
                endEffector.updateWorldMatrix( true, false );
                
                this.srcSkeleton.bones[0].updateWorldMatrix( true, true );
                const srcEndPos = endEffector.getWorldPosition(new THREE.Vector3());
                referenceBone.updateMatrixWorld();
                const srcReferenceWM = referenceBone.matrixWorld.clone();
                const position = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                srcReferenceWM.decompose(position, quaternion, scale);
                // srcReferenceWM.compose(new THREE.Vector3(0,0,0), quaternion, new THREE.Vector3(1,1,1));
                srcReferenceWM.compose(position, quaternion, new THREE.Vector3(1,1,1));

                // const originBone = this.srcSkeleton.bones[chain.chain[chain.chain.length - 1]];
                // originBone.updateWorldMatrix( true, false );
                // const srcOriginPos = originBone.getWorldPosition(new THREE.Vector3());
                // Vector hand respect shoulder (uparm) in chest space (reference space)
                // const srcPos = srcEndPos.sub(srcOriginPos).applyMatrix4(srcReferenceWM.invert());
                // srcEndPos.copy(srcPos);
                srcEndPos.applyMatrix4(srcReferenceWM.invert());
                srcEndPos.x= xScale > 0 ? srcEndPos.x*xScale : srcEndPos.x * scaleF;
                srcEndPos.y*= scaleF;
                srcEndPos.z*= scaleF;
                
                // srcEndPos.multiplyScalar(scaleF);

                this.trgSkeleton.bones[0].updateWorldMatrix( true, true );

                const trgReferenceName = this.boneMap.nameMap[referenceBone.name];
                const trgReferenceBone = this.trgSkeleton.getBoneByName(trgReferenceName);
                trgReferenceBone.updateMatrixWorld();
                
                // const trgOriginBone = this.trgSkeleton.bones[chain.chain[chain.chain.length - 1]];
                // trgOriginBone.updateWorldMatrix( true, false );
                // const trgOriginPos = trgOriginBone.getWorldPosition(new THREE.Vector3());
                
                const trgReferenceWM = trgReferenceBone.matrixWorld.clone();
                trgReferenceWM.decompose(position, quaternion, scale);
                // trgReferenceWM.compose(new THREE.Vector3(0,0,), quaternion, new THREE.Vector3(1,1,1));
                trgReferenceWM.compose(position, quaternion, new THREE.Vector3(1,1,1));
                
                // srcEndPos.applyMatrix4(trgReferenceWM);
                // srcEndPos.add(trgOriginPos);
                srcEndPos.applyMatrix4(trgReferenceWM);
                chain.target.position.copy(srcEndPos);
                const target = chain.target.clone();
                target.material = chain.target.material.clone();
                target.position.copy(srcEndPos);
                this.trgSkeleton.bones[0].parent.parent.parent.add(target);
                ikSolver.setChainEnabler( chainName, true );

                ikSolver.update();
                
                this.trgSkeleton.bones[0].updateWorldMatrix( true, true );
                
                ikSolver.setChainEnabler( chainName, false );
            }

            const srcBoneMap = this.boneMap.srcBoneMap;
            const trgBoneMap = this.boneMap.trgBoneMap;
            
            const trgLArm = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.LArm);
            const trgLElbow = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.LElbow);
            const trgLWrist = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.LWrist);


            const trgRArm = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.RArm);
            const trgRElbow = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.RElbow);
            const trgRWrist = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.RWrist);

            const geometry = new THREE.SphereGeometry(0.001)
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00, depthTest: false } );
            const LArmTarget = new THREE.Mesh( geometry, material );
            const RArmTarget = new THREE.Mesh( geometry, material );
            this.trgSkeleton.bones[0].parent.parent.parent.add(LArmTarget);
            ikSolver.createChain([findIndexOfBone( this.trgSkeleton, trgLWrist), findIndexOfBone( this.trgSkeleton, trgLElbow), findIndexOfBone( this.trgSkeleton, trgLArm)], null, LArmTarget, "LArm");
            ikSolver.setChainEnabler( "LArm", false );
            let chain = ikSolver.getChain("LArm");
            chain.length = 0;
            chain.srcLength = 0;
            
            ikSolver.createChain([findIndexOfBone( this.trgSkeleton, trgRWrist), findIndexOfBone( this.trgSkeleton, trgRElbow), findIndexOfBone( this.trgSkeleton, trgRArm)], null, RArmTarget, "RArm");
            ikSolver.setChainEnabler( "RArm", false );
            chain = ikSolver.getChain("RArm");
            chain.length = 0;
            chain.srcLength = 0;

            // Compute chain lengths
            for(let i = 0; i < ikSolver.chains.length; i++) {
                let bonesIndices = [...ikSolver.chains[i].chain];
                // bonesIndices.push(bonesIndices[bonesIndices.length - 1] - 1)
                // bonesIndices.push(bonesIndices[bonesIndices.length - 1] - 1)
                bonesIndices = [bonesIndices[0] + 4, bonesIndices[0] + 3, bonesIndices[0] + 2, bonesIndices[0] + 1 , ...bonesIndices]

                for( let b = 0; b < bonesIndices.length -1; b++) {
                    let parentPos = this.trgBindPose.bones[bonesIndices[b]].parent.getWorldPosition(new THREE.Vector3());
                    let pos = this.trgBindPose.bones[bonesIndices[b]].getWorldPosition(new THREE.Vector3());
                    ikSolver.chains[i].length += parentPos.distanceTo(pos);

                    const srcIdx = this.boneMap.idxMap.indexOf(bonesIndices[b]);
                    if( srcIdx > -1 ) {
                        parentPos = this.srcBindPose.bones[srcIdx].parent.getWorldPosition(new THREE.Vector3());
                        pos = this.srcBindPose.bones[srcIdx].getWorldPosition(new THREE.Vector3());
                        ikSolver.chains[i].srcLength += parentPos.distanceTo(pos);
                    }
                }
                ikSolver.chains[i].scaleF = ikSolver.chains[i].length/ikSolver.chains[i].srcLength;
            }

            const srcShouldersUnion = this.srcSkeleton.getBoneByName(srcBoneMap.nameMap.ShouldersUnion);
            
            const trgBindShouldersUnion = this.trgBindPose.getBoneByName(trgBoneMap.nameMap.ShouldersUnion);
            const LArmSrc = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff00ff, depthTest: false }) );
            srcShouldersUnion.add(LArmSrc);

            const LArmChain = ikSolver.getChain("LArm");
            const RArmChain = ikSolver.getChain("RArm");
            const trgLBase = this.trgBindPose.bones[LArmChain.chain[LArmChain.chain.length - 1]];
            const trgRBase = this.trgBindPose.bones[RArmChain.chain[RArmChain.chain.length - 1]];

            const trgLBasePos = trgLBase.getWorldPosition(new THREE.Vector3());
            const trgRBasePos = trgRBase.getWorldPosition(new THREE.Vector3());
            const trgShouldersLength = trgRBasePos.distanceTo(trgLBasePos);

            const srcLBase = this.srcBindPose.bones[this.boneMap.idxMap.indexOf(LArmChain.chain[LArmChain.chain.length - 1])];
            const srcRBase = this.srcBindPose.bones[this.boneMap.idxMap.indexOf(RArmChain.chain[RArmChain.chain.length - 1])];

            const srcLBasePos = srcLBase.getWorldPosition(new THREE.Vector3());
            const srcRBasePos = srcRBase.getWorldPosition(new THREE.Vector3());
            const srcShouldersLength = srcRBasePos.distanceTo(srcLBasePos);

            const shouldersScaleF = trgShouldersLength/srcShouldersLength;

  
            const srcReferenceBone = srcShouldersUnion//this.srcSkeleton.getBoneByName(srcBoneMap.nameMap.Neck);
            
            computeTargetLocation("LArm", srcReferenceBone, shouldersScaleF )
            computeTargetLocation("RArm", srcReferenceBone, shouldersScaleF )
                
            
    }
    async applyIKrefinement( srcAnim, trgAnim, ikSolver) {
        return new Promise( (resolve, reject) => {

            const computeTargetLocation = ( chainName, referenceBone, timeIdx, xScale = 0) => {
                const chain = ikSolver.getChain(chainName);
                const scaleF = chain.length/chain.srcLength;
                const endEffector = this.srcSkeleton.bones[chain.chain[0]];
                endEffector.updateWorldMatrix( true, false );
                
                const srcEndPos = endEffector.getWorldPosition(new THREE.Vector3());
                referenceBone.updateMatrixWorld();
                const srcReferenceWM = referenceBone.matrixWorld.clone();
                const position = new THREE.Vector3();
                const quaternion = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                srcReferenceWM.decompose(position, quaternion, scale);
                // srcReferenceWM.compose(new THREE.Vector3(0,0,0), quaternion, new THREE.Vector3(1,1,1));
                srcReferenceWM.compose(position, quaternion, new THREE.Vector3(1,1,1));

                const originBone = this.srcSkeleton.bones[chain.chain[chain.chain.length - 1]];
                originBone.updateWorldMatrix( true, false );
                const srcOriginPos = originBone.getWorldPosition(new THREE.Vector3());
                // Vector hand respect shoulder (uparm) in chest space (reference space)
                // const srcPos = srcEndPos.sub(srcOriginPos).applyMatrix4(srcReferenceWM.invert());
                // srcEndPos.copy(srcPos);
                srcEndPos.applyMatrix4(srcReferenceWM.invert());
                srcEndPos.x= xScale > 0 ? srcEndPos.x*xScale : srcEndPos.x * scaleF;
                srcEndPos.y*= scaleF;
                srcEndPos.z*= scaleF;
                
                // srcEndPos.multiplyScalar(scaleF);

                ikSolver.setChainEnabler( chainName, true );
                
                const trgReferenceName = this.boneMap.nameMap[referenceBone.name];
                const trgReferenceBone = this.trgSkeleton.getBoneByName(trgReferenceName);
                trgReferenceBone.updateMatrixWorld();
                
                const trgOriginBone = this.trgSkeleton.bones[chain.chain[chain.chain.length - 1]];
                trgOriginBone.updateWorldMatrix( true, false );
                const trgOriginPos = trgOriginBone.getWorldPosition(new THREE.Vector3());

                const trgReferenceWM = trgReferenceBone.matrixWorld.clone();
                trgReferenceWM.decompose(position, quaternion, scale);
                // trgReferenceWM.compose(new THREE.Vector3(0,0,), quaternion, new THREE.Vector3(1,1,1));
                trgReferenceWM.compose(position, quaternion, new THREE.Vector3(1,1,1));

                // srcEndPos.applyMatrix4(trgReferenceWM);
                // srcEndPos.add(trgOriginPos);
                srcEndPos.applyMatrix4(trgReferenceWM);
                chain.target.position.copy(srcEndPos);
                const target = chain.target.clone();
                target.material = chain.target.material.clone();
                target.position.copy(srcEndPos);
                target.material.color.lerp(new THREE.Color(0,0,0), timeIdx/ srcAnim.tracks[0].times.length )
                this.trgSkeleton.bones[0].parent.parent.parent.add(target);

                ikSolver.update();
                
                this.trgSkeleton.bones[0].updateWorldMatrix( true, true );
                for(let i = 0; i < chain.chain.length; i++) {
                    const boneIdx = chain.chain[i];
                    if(!tracks[chainName][i]) {
                        continue;
                    }
                    let q = this.trgSkeleton.bones[boneIdx].quaternion;
                    tracks[chainName][i].values[timeIdx*4] = q.x;
                    tracks[chainName][i].values[timeIdx*4+1] = q.y;
                    tracks[chainName][i].values[timeIdx*4+2] = q.z;
                    tracks[chainName][i].values[timeIdx*4+3] = q.w;
                }
                
                ikSolver.setChainEnabler( chainName, false );
            }


            const srcBoneMap = this.boneMap.srcBoneMap;
            const trgBoneMap = this.boneMap.trgBoneMap;

            const srcMixer = new THREE.AnimationMixer(this.srcSkeleton.bones[0].parent.parent);
            srcMixer.clipAction(srcAnim).play();
            const trgMixer = new THREE.AnimationMixer(this.trgSkeleton.bones[0].parent.parent);
            trgMixer.clipAction(trgAnim).play();
            
            const trgLArm = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.LArm);
            const trgLElbow = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.LElbow);
            const trgLWrist = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.LWrist);

            const srcRArm = this.srcSkeleton.getBoneByName(srcBoneMap.nameMap.RArm);
            const srcRElbow = this.srcSkeleton.getBoneByName(srcBoneMap.nameMap.RElbow);
            const srcRWrist = this.srcSkeleton.getBoneByName(srcBoneMap.nameMap.RWrist);

            const trgRArm = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.RArm);
            const trgRElbow = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.RElbow);
            const trgRWrist = this.trgSkeleton.getBoneByName(trgBoneMap.nameMap.RWrist);

            const geometry = new THREE.SphereGeometry(0.001)
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00, depthTest: false } );
            const LArmTarget = new THREE.Mesh( geometry, material );
            const RArmTarget = new THREE.Mesh( geometry, material );
            this.trgSkeleton.bones[0].parent.parent.parent.add(LArmTarget);
            ikSolver.createChain([findIndexOfBone( this.trgSkeleton, trgLWrist), findIndexOfBone( this.trgSkeleton, trgLElbow), findIndexOfBone( this.trgSkeleton, trgLArm)], null, LArmTarget, "LArm");
            ikSolver.setChainEnabler( "LArm", false );
            let chain = ikSolver.getChain("LArm");
            chain.length = 0;
            chain.srcLength = 0;
            
            ikSolver.createChain([findIndexOfBone( this.trgSkeleton, trgRWrist), findIndexOfBone( this.trgSkeleton, trgRElbow), findIndexOfBone( this.trgSkeleton, trgRArm)], null, RArmTarget, "RArm");
            ikSolver.setChainEnabler( "RArm", false );
            chain = ikSolver.getChain("RArm");
            chain.length = 0;
            chain.srcLength = 0;

            // Get tracks affected by chains
            let tracks = { "LArm": [null, null, null], "RArm": [null, null, null]}; // save tracks that modifies bones in chains
            for(let i = 0; i < trgAnim.tracks.length; i++ ) {
                const track = trgAnim.tracks[i];
                for(let j = 0; j < ikSolver.chains.length; j++) {
                    const bonesIndices = ikSolver.chains[j].chain;
                    for( let b = 0; b < bonesIndices.length; b++) {
                        const bone = this.trgSkeleton.bones[bonesIndices[b]];
                        if(track.name.includes(`${bone.name}.quaternion`)) {
                            tracks[ikSolver.chains[j].name][b] = track;
                            continue;
                        }
                    }
                }
            }

            // Compute chain lengths
            for(let i = 0; i < ikSolver.chains.length; i++) {
                let bonesIndices = [...ikSolver.chains[i].chain];
                // bonesIndices.push(bonesIndices[bonesIndices.length - 1] - 1)
                // bonesIndices.push(bonesIndices[bonesIndices.length - 1] - 1)
                bonesIndices = [bonesIndices[0] + 4, bonesIndices[0] + 3, bonesIndices[0] + 2, bonesIndices[0] + 1 , ...bonesIndices]

                for( let b = 0; b < bonesIndices.length -1; b++) {
                    let parentPos = this.trgBindPose.bones[bonesIndices[b]].parent.getWorldPosition(new THREE.Vector3());
                    let pos = this.trgBindPose.bones[bonesIndices[b]].getWorldPosition(new THREE.Vector3());
                    ikSolver.chains[i].length += parentPos.distanceTo(pos);

                    const srcIdx = this.boneMap.idxMap.indexOf(bonesIndices[b]);
                    if( srcIdx > -1 ) {
                        parentPos = this.srcBindPose.bones[srcIdx].parent.getWorldPosition(new THREE.Vector3());
                        pos = this.srcBindPose.bones[srcIdx].getWorldPosition(new THREE.Vector3());
                        ikSolver.chains[i].srcLength += parentPos.distanceTo(pos);
                    }
                }
                ikSolver.chains[i].scaleF = ikSolver.chains[i].length/ikSolver.chains[i].srcLength;
            }

            const srcShouldersUnion = this.srcSkeleton.getBoneByName(srcBoneMap.nameMap.ShouldersUnion);
            
            const trgBindShouldersUnion = this.trgBindPose.getBoneByName(trgBoneMap.nameMap.ShouldersUnion);
            const LArmSrc = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff00ff, depthTest: false }) );
            srcShouldersUnion.add(LArmSrc);

            const LArmChain = ikSolver.getChain("LArm");
            const RArmChain = ikSolver.getChain("RArm");
            const trgLBase = this.trgBindPose.bones[LArmChain.chain[LArmChain.chain.length - 1]];
            const trgRBase = this.trgBindPose.bones[RArmChain.chain[RArmChain.chain.length - 1]];

            const trgLBasePos = trgLBase.getWorldPosition(new THREE.Vector3());
            const trgRBasePos = trgRBase.getWorldPosition(new THREE.Vector3());
            const trgShouldersLength = trgRBasePos.distanceTo(trgLBasePos);

            const srcLBase = this.srcBindPose.bones[this.boneMap.idxMap.indexOf(LArmChain.chain[LArmChain.chain.length - 1])];
            const srcRBase = this.srcBindPose.bones[this.boneMap.idxMap.indexOf(RArmChain.chain[RArmChain.chain.length - 1])];

            const srcLBasePos = srcLBase.getWorldPosition(new THREE.Vector3());
            const srcRBasePos = srcRBase.getWorldPosition(new THREE.Vector3());
            const srcShouldersLength = srcRBasePos.distanceTo(srcLBasePos);

            const shouldersScaleF = trgShouldersLength/srcShouldersLength;

            srcMixer.update(0.01);
            trgMixer.update(0.01);
            
            const srcReferenceBone = this.srcSkeleton.getBoneByName(srcBoneMap.nameMap.Neck);
            const times = srcAnim.tracks[0].times;
            for(let i = 0; i < times.length; i++) {
                const t = times[i];
                srcMixer.setTime(t);
                trgMixer.setTime(t);
                computeTargetLocation("LArm", srcReferenceBone, i, shouldersScaleF )
                computeTargetLocation("RArm", srcReferenceBone, i, shouldersScaleF )
                
            }
            srcMixer.uncacheRoot(this.srcSkeleton.bones[0].parent.parent);
            trgMixer.uncacheRoot(this.trgSkeleton.bones[0].parent.parent);
            srcMixer.uncacheClip(srcAnim);
            trgMixer.uncacheClip(trgAnim);
            resolve();
        })
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

/**
     * Apply a T-pose shape to the passed skeleton.     
     * @param {THREE.Skeleton} skeleton 
     * @param {Object} map 
     */
function applyTPose(skeleton, map) {
     
    if(!map) {
        map = computeAutoBoneMap(skeleton);
        map = map.nameMap;
    }
    else {
        if(Object.values(map).every(value => value === null)) {
            map = computeAutoBoneMap(skeleton);
            map = map.nameMap;
        }
    }
    
    let resultSkeleton = AnimationRetargeting.prototype.cloneRawSkeleton( skeleton, AnimationRetargeting.BindPoseModes.CURRENT, true );
    // Check if spine is extended 
    let spineBase = resultSkeleton.getBoneByName(map.Head); // spine
    let spineChild = spineBase.children[0].name.includes("Head") ? spineBase.children[0] : spineBase.children[spineBase.children.length - 1];
    let spineParent = spineBase; 
    let parent = spineParent.parent;
    while(parent && parent.isBone) {
        let pos = spineParent.getWorldPosition(new THREE.Vector3());
        let parentPos = parent.getWorldPosition(new THREE.Vector3());  
        // Compute direction (parent-to-child)
        let dir = new THREE.Vector3(); 
        dir.subVectors(pos, parentPos).normalize();
        alignBoneToAxis(spineParent, dir, spineChild);
        spineChild = spineChild.parent;
        spineParent = spineParent.parent; 
        parent = spineParent.parent;
    }

    // Force spine and legs in the same plane
    spineBase = resultSkeleton.getBoneByName(map.BelowStomach); // spine
    spineChild = resultSkeleton.getBoneByName(map.Stomach);
    let leg = resultSkeleton.getBoneByName(map.LUpLeg);


    //------------------------------------ LOOK AT Z-AXIS ------------------------------------//
    // Check if the resultSkeleton is oriented in the +Z using the plane formed by left up and the hips
    let leftBaseLeg = resultSkeleton.getBoneByName(map.LUpLeg); // left up leg
    if(!leftBaseLeg) {
        return skeleton;
    }
    let rightBaseLeg = resultSkeleton.getBoneByName(map.RUpLeg); // right up leg
    if(!rightBaseLeg) {
        return skeleton;
    }

    let hips = leftBaseLeg.parent; // hips
    if(!hips) {
        return skeleton;
    }
    
    let leftBaseLegPos = leftBaseLeg.getWorldPosition(new THREE.Vector3());
    let leftLegPos = leftBaseLeg.children[0].getWorldPosition(new THREE.Vector3());        // new THREE.Vector3().setFromMatrixPosition(hips.matrixWorld); // BEST PERFORMANCE

    // Compute up left leg direciton
    let leftLegDir = new THREE.Vector3();
    leftLegDir.subVectors(leftBaseLegPos, leftLegPos).normalize();

    let rightBaseLegPos = rightBaseLeg.getWorldPosition(new THREE.Vector3());

    // Compute up left leg to up right leg direciton
    let leftToRightDir = new THREE.Vector3();
    leftToRightDir.subVectors(rightBaseLegPos, leftBaseLegPos).normalize();

    // Compute perpendicular axis between left up and left-to-right
    let axis = new THREE.Vector3();        
    axis.crossVectors(leftLegDir, leftToRightDir).normalize();

    let zAxis = new THREE.Vector3(0, 0, 1);
    // Compute angle (rad) between perpendicular axis and z-axis
    let angle = (zAxis).angleTo(axis);
   
    if(Math.abs(angle) > 0.01) {
        let rot = new THREE.Quaternion();//.setFromAxisAngle(yAxis, -angle);

        // Get spine bone global rotation 
        let hipsRot = hips.getWorldQuaternion(new THREE.Quaternion());
        // Apply computed rotation to the spine bone global rotation
        rot = rot.setFromUnitVectors(axis, zAxis)
        hipsRot = hipsRot.premultiply(rot);
        
        if (hips.parent) {
            let parent = hips.parent;
            let hipsParentRot = parent.getWorldQuaternion(new THREE.Quaternion());
            // Convert new spine bone global rotation to local rotation and set to the bone
            hips.quaternion.copy(hipsRot.premultiply(hipsParentRot.invert()));
            // let hipsParentPos = parent.getWorldPosition(new THREE.Vector3());

            // hips.position.copy(spineDirO.sub(hipsParentPos));

        }
        else {
            hips.quaternion.copy(hipsRot);
            // hips.position.copy(spineDirO);
        }
        // Update bone matrix and children matrices
        hips.updateMatrix();
        hips.updateMatrixWorld(true, true);
    }
    // Check if spine follows +Y axis
    spineBase = resultSkeleton.getBoneByName(map.BelowStomach); // spine
    let yAxis = new THREE.Vector3(0, 1, 0);
    alignBoneToAxis(hips, yAxis, spineBase);

    //------------------------------------ LEGS ALIGNED TO Y-AXIS ------------------------------------//
    // Check if left leg is extended
    let leftLegEnd = resultSkeleton.getBoneByName(map.LFoot); // foot
    if(!leftLegEnd) {
        return skeleton;
    }
    let leftLegBase = leftLegEnd.parent; // knee
    parent = leftLegBase.parent; // up-leg
    
    let leftLegBasePos = leftLegBase.getWorldPosition(new THREE.Vector3());
    let parentPos = parent.getWorldPosition(new THREE.Vector3());  

    // Compute up leg direction (up-leg-to-knee)
    let leftLegBaseDir = new THREE.Vector3(); 
    leftLegBaseDir.subVectors(leftLegBasePos, parentPos).normalize();
    alignBoneToAxis(leftLegBase, leftLegBaseDir);

    // Check if left leg follow the -Y axis
    yAxis = new THREE.Vector3(0, -1, 0);
    leftLegEnd = resultSkeleton.getBoneByName(map.LFoot);
    leftLegBase = leftLegEnd.parent;

    alignBoneToAxis(parent, yAxis);
    
    // Compute perpendicular axis between left leg and left foot
    leftLegBasePos = leftLegEnd.getWorldPosition(new THREE.Vector3());
    let child = leftLegEnd.children[0].children.length ? leftLegEnd.children[0].children[0] : leftLegEnd.children[0];
    let childPos = child.getWorldPosition(new THREE.Vector3());  

    // Compute leg direction (foot-to-footend)
    leftLegBaseDir.subVectors(childPos, leftLegBasePos).normalize();
    
    axis.crossVectors(leftLegBaseDir, yAxis).normalize();
    var xAxis = new THREE.Vector3(1, 0, 0);

    // Compute angle (rad) between perpendicular axis and x-axis
    angle = (xAxis).angleTo(axis);
    
    if(Math.abs(angle) > 0.001) {
        let rot = new THREE.Quaternion();//.setFromAxisAngle(yAxis, -angle);

        // Get foot bone global rotation 
        let footRot = leftLegEnd.getWorldQuaternion(new THREE.Quaternion());
        // Apply computed rotation to the foot bone global rotation
        rot = rot.setFromUnitVectors(axis, xAxis)
        leftLegBaseDir.applyQuaternion(rot);
        footRot.premultiply(rot);
        
        if (leftLegEnd.parent) {
            let parent = leftLegEnd.parent;
            let footParentRot = parent.getWorldQuaternion(new THREE.Quaternion());
            // Convert new spine bone global rotation to local rotation and set to the bone
            leftLegEnd.quaternion.copy(footRot.premultiply(footParentRot.invert()));
        }
        else {
            leftLegEnd.quaternion.copy(footRot);
        }
        // Update bone matrix and children matrices
        leftLegEnd.updateMatrix();
        leftLegEnd.updateMatrixWorld(true, true);
    }

    // Check if right leg is extended
    let rightLegEnd = resultSkeleton.getBoneByName(map.RFoot); // foot
    if(!rightLegEnd) {
        return skeleton;
    }
    let rightLegBase = rightLegEnd.parent; // knee
    parent = rightLegBase.parent; // up-leg
    
    let rightLegBasePos = rightLegBase.getWorldPosition(new THREE.Vector3());
    parentPos = parent.getWorldPosition(new THREE.Vector3());  

    // Compute up leg direction (up-leg-to-knee)
    let rightLegBaseDir = new THREE.Vector3(); 
    rightLegBaseDir.subVectors(rightLegBasePos, parentPos).normalize();
    alignBoneToAxis(rightLegBase, rightLegBaseDir);

    // Check if right leg follow the -Y axis
    rightLegEnd = resultSkeleton.getBoneByName(map.RFoot);
    rightLegBase = rightLegEnd.parent;

    alignBoneToAxis(parent, yAxis);
           
    // child = rightLegEnd;
    // parent = rightLegBase;
    // while(child && child.isBone && child.children.length) {
    //     let pos = parent.getWorldPosition(new THREE.Vector3());
    //     let parentPos = parent.parent.getWorldPosition(new THREE.Vector3());  
    //     // Compute direction (parent-to-child)
    //     let dir = new THREE.Vector3(); 
    //     dir.subVectors(pos, parentPos).normalize();
    //     this.alignBoneToAxis(child, dir);
    //     parent = child;             
    //     child = child.children[0];
    // }

    // Compute perpendicular axis between right leg and right foot
    rightLegBasePos = rightLegEnd.getWorldPosition(new THREE.Vector3());
    child = rightLegEnd.children[0].children.length ? rightLegEnd.children[0].children[0] : rightLegEnd.children[0];
    childPos = child.getWorldPosition(new THREE.Vector3());  

    // Compute leg direction (foot-to-footend)
    rightLegBaseDir.subVectors(childPos, rightLegBasePos).normalize();
    
    axis.crossVectors(rightLegBaseDir, yAxis).normalize();
    xAxis = new THREE.Vector3(1, 0, 0);

    // Compute angle (rad) between perpendicular axis and x-axis
    angle = (xAxis).angleTo(axis);
    
    if(Math.abs(angle) > 0.001) {
        let rot = new THREE.Quaternion();//.setFromAxisAngle(yAxis, -angle);

        // Get foot bone global rotation 
        let footRot = rightLegEnd.getWorldQuaternion(new THREE.Quaternion());
        // Apply computed rotation to the foot bone global rotation
        rot = rot.setFromUnitVectors(axis, xAxis)
        rightLegBaseDir.applyQuaternion(rot);
        footRot.premultiply(rot);
        
        if (rightLegEnd.parent) {
            let parent = rightLegEnd.parent;
            let footParentRot = parent.getWorldQuaternion(new THREE.Quaternion());
            // Convert new spine bone global rotation to local rotation and set to the bone
            rightLegEnd.quaternion.copy(footRot.premultiply(footParentRot.invert()));
        }
        else {
            rightLegEnd.quaternion.copy(footRot);
        }
        // Update bone matrix and children matrices
        rightLegEnd.updateMatrix();
        rightLegEnd.updateMatrixWorld(true, true);
    }
    //------------------------------------ ARMS COMPLETLY EXTENDED AND ALIGNED TO X-AXIS ------------------------------------//
    //LEFT
        
    // Check if left arm follow the +X axis
    let lArm = resultSkeleton.getBoneByName(map.LArm).parent;
    var xAxis = new THREE.Vector3(1, 0, 0);
    alignBoneToAxis(lArm, xAxis);
    // Check if left arm is extended
    let leftEnd = resultSkeleton.getBoneByName(map.LWrist); // hand
    let leftBase = leftEnd.parent; 
    parent = leftBase.parent; 
    let spine = resultSkeleton.getBoneByName(map.ShouldersUnion);

    while(parent != spine) {
        let pos = leftBase.getWorldPosition(new THREE.Vector3());
        let parentPos = parent.getWorldPosition(new THREE.Vector3());  
        // Compute direction (parent-to-child)
        let dir = new THREE.Vector3(); 
        dir.subVectors(pos, parentPos).normalize();
        alignBoneToAxis(leftBase, dir);
        leftEnd = leftEnd.parent;
        leftBase = leftBase.parent; 
        parent = leftBase.parent;
    }


    const innerLoop = (parent) => {
        child = parent.children[0];
        while(parent.children.length) {
 
            alignBoneToAxis(parent, xAxis);
            parent = child;
            child = parent.children[0];
        }
    }

    // Extend left hand fingers
    leftEnd = resultSkeleton.getBoneByName(map.LWrist);
    for(let i = 0; i < leftEnd.children.length; i++) {
        innerLoop(leftEnd.children[i]);
    }
   
    //RIGHT
    // Check if right arm follow the -X axis
    let rArm = resultSkeleton.getBoneByName(map.RArm).parent;
    var xAxis = new THREE.Vector3(-1, 0, 0);
    alignBoneToAxis(rArm, xAxis);
    // Check if right arm is extended
    let rightEnd = resultSkeleton.getBoneByName(map.RWrist); // hand
    let rightBase = rightEnd.parent; 
    parent = rightBase.parent; 
    spine = resultSkeleton.getBoneByName(map.ShouldersUnion);
    while(parent != spine) {
        let pos = rightBase.getWorldPosition(new THREE.Vector3());
        let parentPos = parent.getWorldPosition(new THREE.Vector3());  
        // Compute direction (parent-to-child)
        let dir = new THREE.Vector3(); 
        dir.subVectors(pos, parentPos).normalize();
        alignBoneToAxis(rightBase, dir);
        rightEnd = rightEnd.parent;
        rightBase = rightBase.parent; 
        parent = rightBase.parent;
    }

    // Extend left hand fingers
    rightEnd = resultSkeleton.getBoneByName(map.RWrist);
    for(let i = 0; i < rightEnd.children.length; i++) {
        innerLoop(rightEnd.children[i]);
    }

    // resultSkeleton.calculateInverses();
    
    resultSkeleton.update();
    
    for(let i = 0; i < skeleton.bones.length; i++) {
        skeleton.bones[i].position.copy(resultSkeleton.bones[i].position);
        skeleton.bones[i].quaternion.copy(resultSkeleton.bones[i].quaternion);
        skeleton.bones[i].scale.copy(resultSkeleton.bones[i].scale);
        skeleton.bones[i].updateMatrix();
    }
    return {skeleton: skeleton, map};
}

/**
 * Rotate the given bone in order to be aligned with the specified axis
 * @param {THREE.Bone} bone 
 * @param {THREE.Vector3} axis 
 */
function alignBoneToAxis(bone, axis, child) {
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
        }
        else {
            bone.quaternion.copy(boneRot);
        }
        bone.updateMatrix();
        bone.updateMatrixWorld(false, true);
    }
}

/**
 * Maps automatically bones from the skeleton to an auxiliar map. 
 * Given a null bonemap, an automap is performed
 * @param {THREE.Skeleton} srcSkeleton 
 * @returns {object} { idxMap: [], nameMape: {} }
 */
function computeAutoBoneMap( skeleton){
    let auxBones = AnimationRetargeting.standardBones();

    let bones = skeleton.bones;
    let result = {
        idxMap: new Int16Array( auxBones.length ),
        nameMap: {} 
    };
    
    result.idxMap.fill( -1 ); // default to no map;
    for( let i = 0; i < auxBones.length; i++ ) {
        const auxBoneName = auxBones[i].name;

        for( let j = 0; j < bones.length; ++j ) {
            let boneName = bones[j].name;

            if( typeof( boneName ) !== "string" ) { continue; }
            boneName = boneName.toLowerCase().replace( "mixamorig", "" ).replace( /[`~!@#$%^&*()_|+\-=?;:'"<>\{\}\\\/]/gi, "" );
            if( boneName.length < 1 ) { continue; }
            
            if( boneName.toLowerCase() == auxBoneName.toLocaleLowerCase() || boneName.toLowerCase() == AnimationRetargeting.boneMap[auxBoneName].toLocaleLowerCase()) {
                result.nameMap[auxBoneName] = bones[j].name;
                result.idxMap[i] = j;
                break;
            }
        }
    }

    //assumes bone 0 is root (hips)
    const auxData = computeHierarchyData(auxBones[0])
    const boneData = computeHierarchyData(bones[0])
 
    // mapping based on hierarchy
    for( let i = 0; i < auxBones.length; i++ ) {
        const auxBoneName = auxBones[i].name;
        if( result.nameMap[auxBoneName] ) {
            continue;
        }
        const auxBone = auxBones[i]
        const auxBoneInfo = getBoneInfo( auxBone, auxData.depth, auxData.descendantCount);

        for (let j = 0; j < bones.length; j++) {
            if (result.idxMap.indexOf(j) > -1 ) continue;
            
            const bone = bones[j];
            const boneInfo = getBoneInfo(bone, boneData.depth, boneData.descendantCount);

            if (sameBoneInfo(auxBoneInfo, boneInfo)) {
                result.nameMap[auxBoneName] = bones[j].name;
                result.idxMap[i] = j;
                break
            }
        }

        if (!result.nameMap[auxBoneName]) {
            console.warn( 'Failed to match bone by hierarchy structure: ' + auxBoneName);
        }
    }

    return result;
}

function computeHierarchyData( root ) {
  const depth = {}
  const descendantCount = {}

  const traverse = (bone, d) => {
    depth[bone.name] = d
    let count = 0

    for (let i = 0; i < bone.children.length; i++) {
      const child = bone.children[i]
      if (child.isBone) {
        count += 1 + traverse(child, d + 1)
      }
    }

    descendantCount[bone.name] = count
    return count
  }

  traverse(root, 0)
  return { depth, descendantCount }
}

function getBoneInfo(bone, depth, descendantCount) {
   const info = 
   {
    depth: depth[bone.name],
    parentDepth: (bone.parent && bone.parent.isBone) ? depth[bone.parent.name] : -1,
    childCount: bone.children.length,
    descendantCount: descendantCount[bone.name]
  }
  return info;
}

function sameBoneInfo(a, b) {
  return (
    a.depth === b.depth &&
    a.parentDepth === b.parentDepth &&
    a.childCount === b.childCount //&&
    //a.descendantCount === b.descendantCount
  )
}
export { AnimationRetargeting, findIndexOfBone, findIndexOfBoneByName, forceBindPoseQuats, applyTPose, computeAutoBoneMap };