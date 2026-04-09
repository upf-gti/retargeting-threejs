import * as THREE from 'three';


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

        this.precomputedQuats = this._precomputeRetargetingQuats();
        this.proportionRatio = this._computeProportionRatio(); // returns an aproximate ratio of lengths between source skeleton and target skeleton. Used in Position retargeting
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
            }
        }

        return result
    }

    /**
    * Computes an aproximate ratio of lengths between source skeleton and target skeleton
    */
    _computeProportionRatio(){
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

    _precomputeRetargetingQuats(){
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
     * assumes srcTrack IS a position track (VectorKeyframeTrack) with the proper values array and name (boneName.position) 
     * @param {THREE.VectorKeyframeTrack} srcTrack 
     * @returns {THREE.VectorKeyframeTrack}
     */
    retargetPositionTrack( srcTrack ){
        let boneName = srcTrack.name.slice(0, srcTrack.name.length - 9 ); // remove the ".position"
        const boneIndex = findIndexOfBoneByName( this.srcSkeleton, boneName );
        if ( boneIndex < 0 || this.boneMap.idxMap[ boneIndex ] < 0 ){
            return null;
        } 
        // Retargets the root bone posiiton
        const srcValues = srcTrack.values;
        let trgValues = new Float32Array( srcValues.length );
        if( boneIndex == 0 ) { // asume the first bone is the root

            let srcBindPos = this.srcBindPose.bones[boneIndex].getWorldPosition(new THREE.Vector3());
            let trgBindPos = this.trgBindPose.bones[boneIndex].getWorldPosition(new THREE.Vector3());
						
            let pos = new THREE.Vector3();
            let diffPosition = new THREE.Vector3();

            for( let i = 0; i < srcValues.length; i+=3 ){
                
                pos.set( srcValues[i], srcValues[i+1], srcValues[i+2]);
                if(this.srcBindPose.transformsWorldEmbedded) {
                    pos.applyQuaternion(this.srcBindPose.transformsWorldEmbedded.forward.q);
                }
                diffPosition.subVectors(pos, srcBindPos);

                // Scale the animation difference position with the scale diff between source and target and add it to the the Target Bind Position of the bone
                diffPosition.multiplyScalar(this.proportionRatio);
                
                if(this.trgBindPose.transformsWorldEmbedded) {
                    diffPosition.applyQuaternion(this.trgBindPose.transformsWorldEmbedded.inverse.q);
                }
			    diffPosition.add(trgBindPos);
                
                trgValues[i]   = diffPosition.x ;
                trgValues[i+1] = diffPosition.y ;
                trgValues[i+2] = diffPosition.z ;            
            }
        }
        // TODO missing interpolation mode. Assuming always linear. Also check if arrays are copied or referenced
        return new THREE.VectorKeyframeTrack( this.boneMap.nameMap[ boneName ] + ".position", srcTrack.times.slice(), trgValues ); 
    }
    
    /**
     * assumes srcTrack IS a quaternion track with the proper values array and name (boneName.quaternion) 
     * @param {THREE.QuaternionKeyframeTrack} srcTrack 
     * @returns {THREE.QuaternionKeyframeTrack}
     */
    retargetQuaternionTrack( srcTrack ){
        let boneName = srcTrack.name.slice(0, srcTrack.name.length - 11 ); // remove the ".quaternion"
        const boneIndex = findIndexOfBoneByName( this.srcSkeleton, boneName );
        if ( boneIndex < 0 || this.boneMap.idxMap[ boneIndex ] < 0 ){
            return null;
        } 

        let quat = new THREE.Quaternion( 0,0,0,1 );
        const srcValues = srcTrack.values;
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
        return new THREE.QuaternionKeyframeTrack( this.boneMap.nameMap[ boneName ] + ".quaternion", srcTrack.times.slice(), trgValues ); 
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

/**
 * Apply a T-pose shape facing +Z axis  to the passed skeleton.     
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
    
    const resultSkeleton = skeleton;
    
	const x_axis = new THREE.Vector3(1, 0, 0);
	const y_axis = new THREE.Vector3(0, 1, 0);
	const z_axis = new THREE.Vector3(0, 0, 1);

	// Fully extend the chains    
	extendChain( resultSkeleton, resultSkeleton.bones[0].name, map.ShouldersUnion); // Spine
	extendChain( resultSkeleton, map.LUpLeg, map.LFoot); // Left Leg
	extendChain( resultSkeleton, map.RUpLeg, map.RFoot); // Right Leg
	extendChain( resultSkeleton, map.LArm, map.LWrist); // Left Arm
	extendChain( resultSkeleton, map.RArm, map.RWrist); // Right Arm
    
    const leftHand = resultSkeleton.getBoneByName(map.LWrist);
    for(let i = 0; i < leftHand.children.length; i++) { // Left Fingers
        extendChain( resultSkeleton, leftHand.children[i]);
        extendChain( resultSkeleton, map.LWrist, leftHand.children[i].children[0]); // Left Arm
    }
    const rightHand = resultSkeleton.getBoneByName(map.RWrist);
    for(let i = 0; i < rightHand.children.length; i++) { // Right Fingers
        extendChain( resultSkeleton, rightHand.children[i]); 
        extendChain( resultSkeleton, map.RWrist, rightHand.children[i].children[0]); // Right Arm
    }

	// Forces the pose to face the +Z axis using the left-right arm and spine plane
    const right_arm = resultSkeleton.getBoneByName(map.RArm);
    const left_arm = resultSkeleton.getBoneByName(map.LArm);
    
    const spine_base = resultSkeleton.bones[0];
    const spine_end = resultSkeleton.getBoneByName(map.ShouldersUnion);
	
    const rArmPos = right_arm.getWorldPosition(new THREE.Vector3());
    const lArmPos = left_arm.getWorldPosition(new THREE.Vector3());

    const basePos = spine_base.getWorldPosition(new THREE.Vector3());
    const endPos = spine_end.getWorldPosition(new THREE.Vector3());
  
    const spine_dir = new THREE.Vector3();
    spine_dir.subVectors(endPos, basePos).normalize();

    const arms_dir = new THREE.Vector3();
    arms_dir.subVectors(lArmPos, rArmPos).normalize();
	lookBoneAtAxis(resultSkeleton.bones[0], arms_dir, spine_dir, z_axis);
	
	// Align the 5 chains so that they follow their corresponding axes
	// SPINE
    alignBoneToAxis(resultSkeleton, resultSkeleton.bones[0].name, map.ShouldersUnion, y_axis);
	
	// LEGS
	// check if left leg follows the -Y axis
    const neg_y_axis = y_axis.clone().multiplyScalar(-1);
    alignBoneToAxis(resultSkeleton, map.LUpLeg, map.LFoot, neg_y_axis);
	// if check right leg follow the -Y axis
    alignBoneToAxis(resultSkeleton, map.RUpLeg, map.RFoot, neg_y_axis);
    
	// ARMS
	// check if left arm follows the X axis
    alignBoneToAxis(resultSkeleton, map.LArm, map.LWrist, x_axis);
	// if check right arm follow the -X axis
    const neg_x_axis = x_axis.clone().multiplyScalar(-1);
    alignBoneToAxis(resultSkeleton, map.RArm, map.RWrist, neg_x_axis);

    for(let i = 0; i < leftHand.children.length; i++) { // Left Fingers
        alignBoneToAxis( resultSkeleton, leftHand.children[i], null, x_axis); 
    }
    for(let i = 0; i < rightHand.children.length; i++) { // Right Fingers
        alignBoneToAxis( resultSkeleton, rightHand.children[i], null, neg_x_axis); 
    }
	// return new T-pose
    resultSkeleton.update(); 
    return {skeleton: resultSkeleton, map};
}

/**
 * Extends all bones in the given chain (origin and end) to follow the direction of the parent bone and updates it to the given pose
 * @param {THREE.Skeleton} resultSkeleton 
 * @param {String} origin : bone's name 
 * @param {String} end : bone's name 
 */
function extendChain(resultSkeleton, origin, end) {

    const base = typeof(origin) == 'string' ? resultSkeleton.getBoneByName(origin) : origin;
    let previous = null;
    if( !end ) {
        end = base;
        while( end.children.length ) {
            end = end.children[0];            
        }
        previous = end;
    }
    else {
        previous = typeof(end) == 'string' ? resultSkeleton.getBoneByName(end) : end;
    }
	let current = previous.parent;
	let next = current.parent;

	while( next != base.parent ) {
		
		// Extend the bone current_id - previous_id to follow the next_id - current_id direction
		const prevPos = previous.getWorldPosition(new THREE.Vector3());
		const currPos = current.getWorldPosition(new THREE.Vector3());
		const nextPos = next.getWorldPosition(new THREE.Vector3());

		// Direction from the parent joint to the middle joint (desired)
        const desired_dir = new THREE.Vector3();
		desired_dir.subVectors(nextPos, currPos).normalize();
		// Direction from the middle joint to the child joint (current)
		const current_dir = new THREE.Vector3();
        current_dir.subVectors(currPos, prevPos);

		// Angle to go from the current dir to the desired dir
		const angle = current_dir.angleTo(desired_dir);

		if (Math.abs(angle) > 0.01) {
			// Axis of rotation (perpendicular): To rotate from the current to the desired direction
            let axis = new THREE.Vector3();
            axis.crossVectors(current_dir, desired_dir).normalize();
			// Rotation from current to the desired direction in quaterion
			const rot = new THREE.Quaternion().setFromAxisAngle(axis, angle);
			// Apply the rotation to the current rotation of the joint in global space
            let currRot = current.getWorldQuaternion(new THREE.Quaternion());
			currRot = rot.multiply(currRot);
            let nextRot = next.getWorldQuaternion(new THREE.Quaternion());
			// Convert the rotation in local space
			const localRot = nextRot.invert().multiply(currRot);
			current.quaternion.copy(localRot);			
            current.updateMatrix();
            current.updateMatrixWorld(false, true);
		}

		// Update the ids for the next iteration
		previous = current;
		current = next;
		next = next.parent;
	}
}
/**
 * Given the vectors that form a plane and the desired direction where to look, rotates the root bone of the given pose to face at the desired axis.
 * @param {THREE.Bone} bone 
 * @param {THREE.Vector3} dir_a : bone's name 
 * @param {THREE.Vector3} dir_b : bone's name 
 * @param {THREE.Vector3} axis 
 */
function lookBoneAtAxis(bone, dir_a, dir_b, axis ) {
	
	// Face the pose looking at the given axis
	// Normal vector of the plane (perpendicular): Current direction that the character is looking
    let rot_axis = new THREE.Vector3();
    rot_axis.crossVectors(dir_a, dir_b).normalize();
	const angle = rot_axis.angleTo(axis);

	if (Math.abs(angle) > 0.01) {
		// Axis of rotation (perpendicular): To rotate from the current plane direction to the axis direction
        let new_axis = new THREE.Vector3();
        new_axis.crossVectors(rot_axis, axis).normalize();
		// Rotation from current to the desired direction in quaterion
        const rot = new THREE.Quaternion().setFromAxisAngle(new_axis, angle);
			
		// Apply the rotation to the current rotation of the joint in global space
        let global_rot = bone.getWorldQuaternion(new THREE.Quaternion())
		global_rot = rot.multiply(global_rot);

		// Convert the rotation in local space
        let local_rot = global_rot;
        // Convert the rotation in local space
        if ( bone.parent ) {
            const parent_rot = bone.parent.getWorldQuaternion(new THREE.Quaternion());
            local_rot = parent_rot.invert().multiply(global_rot);
        }
		bone.quaternion.copy(local_rot);
        bone.updateMatrix();
        bone.updateMatrixWorld(false, true);
	}
}


/**
 * Aligns the direction of the origin-end vector to follow the given axis and updates the direction at the given pose
 * @param {THREE.Skeleton} resultSkeleton 
 * @param {String} origin : bone's name 
 * @param {String} end : bone's name 
 * @param {THREE.Vector3} axis 
 */
function alignBoneToAxis(resultSkeleton, origin, end = null, axis ) {
    
	// Rotate the direction of the origin-end vector to follow the given axis
	const oBone = typeof(origin) == 'string' ? resultSkeleton.getBoneByName(origin) : origin;
    oBone.updateMatrixWorld(true, true);
    if( !end ) {
        end = oBone.children[0];
    }
    const eBone = typeof(end) == 'string' ? resultSkeleton.getBoneByName(end) : end;
    // Get global positions
    const oPos = oBone.getWorldPosition(new THREE.Vector3());
    const ePos = eBone.getWorldPosition(new THREE.Vector3());
    
    // Compute the unitary direction of the bone from its position and its child position
    let dir = new THREE.Vector3();
    dir.subVectors(ePos, oPos).normalize();

	// Angle between the current direction and the desired direction 
	const angle = (dir).angleTo(axis);
    if( Math.abs(angle) > 0.001 ) {
        // Axis of rotation (perpendicular): To rotate from the current to the desired direction
        let new_axis = new THREE.Vector3();
        new_axis.crossVectors(dir, axis).normalize();
        // Rotation from current to the desired direction in quaterion
        const rot = new THREE.Quaternion().setFromAxisAngle(new_axis, angle);
        // Get bone global rotation 
        let oRot = oBone.getWorldQuaternion(new THREE.Quaternion())
        // Apply the rotation to the current rotation of the joint in global space
        oRot = rot.multiply(oRot);
        let oLocalRot = oRot;
        // Convert the rotation in local space
        if ( oBone.parent ) {
            const oParentRot = oBone.parent.getWorldQuaternion(new THREE.Quaternion());
            oLocalRot = oParentRot.invert().multiply(oRot);
        }

        oBone.quaternion.copy(oLocalRot);
        oBone.updateMatrix();
        oBone.updateMatrixWorld(false, true);
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
