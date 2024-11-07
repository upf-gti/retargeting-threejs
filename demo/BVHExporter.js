import * as THREE from "three";

const BVHExporter = {

    getTabs: function(level) {
        
        let tabs = "";
        for (let i = 0; i < level; ++i) {
            tabs += "\t";
        }
        return tabs;
    },

    exportBone: function(bone, level) {

        let isEndSite = bone.children.length == 0;

        let tabs = this.getTabs(level);
        let bvh = tabs;
        if(bone.type != 'Bone')
            return "";
        let exportPos = false;
        if (!bone.parent || bone.parent.type != 'Bone') {
            bvh += "ROOT " + bone.name + "\n";
            exportPos = true;
        } else if (isEndSite) {
            bvh += "End Site" + "\n";
        } 
        else {
            bvh += "JOINT " + bone.name + "\n";
        }

        let position = this.skeleton.getBoneByName( bone.name ).getWorldPosition(new THREE.Vector3());
        let parentPos = this.skeleton.getBoneByName( bone.name ).parent ? this.skeleton.getBoneByName( bone.name ).parent.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
        
        position.sub(parentPos);

        bvh += tabs + "{\n";
        bvh += tabs + "\tOFFSET "   + position.x.toFixed(6) +
                            " "     + position.y.toFixed(6) +
                            " "     + position.z.toFixed(6) + "\n";

        if (!isEndSite) {
            if (exportPos) {
                bvh += tabs + "\tCHANNELS 6 Xposition Yposition Zposition Xrotation Yrotation Zrotation\n";
            } else {
                bvh += tabs + "\tCHANNELS 3 Xrotation Yrotation Zrotation\n";
            }
        }

        for (let i = 0; i < bone.children.length; ++i) {
            bvh += this.exportBone(bone.children[i], level + 1);
        }

        bvh += tabs + "}\n";

        return bvh;
    },

    quatToEulerString: function(q) {
        let euler = new THREE.Euler();
        euler.setFromQuaternion(q);
        return THREE.MathUtils.radToDeg(euler.x).toFixed(6) + " " + THREE.MathUtils.radToDeg(euler.y).toFixed(6) + " " + THREE.MathUtils.radToDeg(euler.z).toFixed(6) + " ";
    },

    posToString: function(p) {
        return p.x.toFixed(6) + " " + p.y.toFixed(6) + " " + p.z.toFixed(6) + " ";
    },

    export: function(action, skeleton, clip) {

        let bvh = "";
        const framerate = 1 / 30;
        const numFrames = 1 + Math.floor(clip.duration / framerate);

        this.skeleton = skeleton;
        skeleton.pose(); // needs to be in bind pose (tpose)

        bvh += "HIERARCHY\n";

        if (skeleton.bones[0] == undefined) {
            console.error("Can not export skeleton with no bones");
            return;
        }

        bvh += this.exportBone(skeleton.bones[0], 0);
        
        bvh += "MOTION\n";
        bvh += "Frames: " + numFrames + "\n";
        bvh += "Frame Time: " + framerate + "\n";

        const interpolants = action._interpolants;

        const getBoneFrameData = (time, bone) => {

            let data = "";

            // End site
            if(!bone.children.length)
            return data;

            // const tracks = clip.tracks.filter( t => t.name.replaceAll(".bones").split(".")[0].includes(bone.name) );
            const tracks = clip.tracks.filter( t => {
                let name = t.name.replaceAll(".bones");
                let idx = name.lastIndexOf("."); 
                if ( idx >= 0 ){
                    name = name.slice( 0, idx );
                }
                return name === bone.name; 
            } );
            
            const pos = new THREE.Vector3(0,0,0);
            const quat = new THREE.Quaternion(0,0,0,1);

            // No animation info            
            for(let i = 0; i < tracks.length; ++i) {

                const t = tracks[i];
                const trackIndex = clip.tracks.indexOf( t );
                const interpolant = interpolants[ trackIndex ];
                const values = interpolant.evaluate(time);
                
                const type = t.name.replaceAll(".bones").split(".")[1];
                switch(type) {
                    case 'position':
                        // threejs animation clips store a position which will be attached to the bone each frame.
                        // However, BVH position track stores the translation from the bone's offset defined in HERIARCHY
                        if (values.length) {
                            pos.fromArray(values.slice(0, 3));
                            pos.sub(bone.position);
                        }
                        break;
                    case 'quaternion': // retarget animation quaternion to the bvh bind posed skeleton
                        if (values.length) {
                            quat.fromArray(values.slice(0, 4));
                            let invWorldRot = this.skeleton.getBoneByName( bone.name ).getWorldQuaternion(new THREE.Quaternion()).invert();
                            let wordlParentBindRot = this.skeleton.getBoneByName( bone.name ).parent.getWorldQuaternion(new THREE.Quaternion());
                            quat.premultiply(wordlParentBindRot).multiply(invWorldRot);
                        }else{
                            quat.set(0,0,0,1);
                        }
                        break;
                }
            }

            // TODO: check for channels in bone heriarchy to acurately determine which attributes and in which order should appear
            // add position track if root
            if ( !bone.parent || !bone.parent.isBone ){ 
                data += this.posToString(pos); 
            }
            data += this.quatToEulerString(quat);

            // process and append children's data (following HIERARCHY) 
            for (const b of bone.children)
                data += getBoneFrameData(time, b);

            return data;
        }

        for( let frameIdx = 0; frameIdx < numFrames; ++frameIdx ) {
            bvh += getBoneFrameData(frameIdx * framerate, skeleton.bones[0]);
            bvh += "\n";
        }

        this.skeleton = null;
        
        return bvh;
    },

    exportCustom: function(action, skeleton, clip) {

        let bvh = "";

        this.skeleton = skeleton;

        bvh += "HIERARCHY\n";

        if (skeleton.bones[0] == undefined) {
            console.error("Can not export skeleton with no bones");
            return;
        }

        bvh += this.exportBone(skeleton.bones[0], 0);
        
        bvh += "MOTION\n";

        const interpolants = action._interpolants;

        const getBoneFrameData = (bone) => {

            let data = "";

            // End site
            if(!bone.children.length)
            return data;

            const tracks = clip.tracks.filter( t => t.name.replaceAll(".bones").split(".")[0].includes(bone.name) );

            if(tracks.length) {
                data += "\n" + bone.name;
            }

            for(let i = 0; i < tracks.length; ++i) {

                const t = tracks[i];
                const type = t.name.replaceAll(".bones").split(".")[1];
                data += "\n" + type + " @";

                for( let j = 0; j < t.times.length; ++j ) {
                    
                    data += t.times[j] + " ";

                    switch(type) {
                        case 'position':
                            const pos = new THREE.Vector3();
                            pos.fromArray(t.values.slice(j * 3, j * 3 + 3));
                            data += this.posToString(pos);
                            break;
                        case 'quaternion':
                            const q = new THREE.Quaternion();
                            q.fromArray(t.values.slice(j * 4, j * 4 + 4));
                            data += this.quatToEulerString(q);
                    }
                }

            }

            for (const b of bone.children)
                data += getBoneFrameData(b);

            return data;
        }

        bvh += getBoneFrameData(skeleton.bones[0]);
        
        this.skeleton = null;

        return bvh;
    },

    exportMorphTargets: function(action, morphTargetDictionary, clip) {

        if ( !action || !morphTargetDictionary || !clip || !clip.tracks.length ){
            return "";
        }
        
        let bvh = "";
        const framerate = 1 / 30;
        const numFrames = 1 + Math.floor(clip.duration / framerate);

        bvh += "BLENDSHAPES\n";
        bvh += '{\n';
        if (morphTargetDictionary == undefined) {
            console.error("Can not export animation with morph targets");
            return;
        }
        let morphTargets = Object.keys(morphTargetDictionary);
        morphTargets.map((v) => {bvh += "\t" + v + "\n"});
        bvh += "}\n";
        bvh += "MOTION\n";
        bvh += "Frames: " + numFrames + "\n";
        bvh += "Frame Time: " + framerate + "\n";

        const interpolants = action._interpolants;
        if(!interpolants.length) {
            return bvh;
        }
        const getMorphTargetFrameData = (time, morphTarget) => {

            let data = "";
            for(let idx = 0; idx < morphTarget.length; idx++)
            {
                const tracks = clip.tracks.filter( t => t.name.includes('[' + morphTarget[idx] + ']') );
                // No animation info            
                if(!tracks.length){
                    data += "0.000 "; // TO DO consider removing the blendshape instead of filling with 0
                    // console.warn("No tracks for " + morphTarget[idx])
                }
                else {
                   
                    const t = tracks[0];
                    const trackIndex = clip.tracks.indexOf( t );
                    const interpolant = interpolants[ trackIndex ];
                    const values = interpolant.evaluate(time);
                    data += values[0].toFixed(3) + " ";
                    
                }
            }

            return data;
        }
        
        for( let frameIdx = 0; frameIdx < numFrames; ++frameIdx ) {
            bvh += getMorphTargetFrameData(frameIdx * framerate, morphTargets);
            bvh += "\n";
        }

        return bvh;
    },
};

export { BVHExporter }