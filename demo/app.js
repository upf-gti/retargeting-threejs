import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BVHLoader } from './BVHeLoader.js';
import { BVHExporter } from './BVHExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js' 
import { Gui } from './gui.js'
import { AnimationRetargeting } from '../retargeting.js'

class App {
    constructor() {
        
        this.elapsedTime = 0; // clock is ok but might need more time control to dinamicaly change signing speed
        this.clock = new THREE.Clock();
        this.loaderBVH = new BVHLoader();
        this.loaderGLB = new GLTFLoader();
        this.GLTFExporter = new GLTFExporter();
        this.currentCharacter = "";
        this.loadedCharacters = {}; // store avatar loadedCharacters

        this.currentAnimation = "";
        this.loadedAnimations = {};
        this.bindedAnimations = {};

        this.mixer = null;
        this.playing = false;

        this.speed = 1;
        this.showSkeletons = true;
        this.gui = null;
        this.retargeting = null;
    }

    init() {        
        this.scene = new THREE.Scene();
        let sceneColor = 0xa0a0a0;//0x303030;
        this.scene.background = new THREE.Color( sceneColor );
        this.scene.fog = new THREE.Fog( sceneColor, 10, 50 );

        // renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1;
        // this.renderer.shadowMap.enabled = false;
        document.body.appendChild( this.renderer.domElement );

        //include lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
        hemiLight.position.set( 0, 50, 0 );
        this.scene.add( hemiLight );

        const hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
        this.scene.add( hemiLightHelper );

        const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
        dirLight.position.set( - 1, 1.75, 1 );
        dirLight.position.multiplyScalar( 30 );
        this.scene.add( dirLight );

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        const d = 50;

        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = - 0.0001;

        // add entities
        let ground = new THREE.Mesh( new THREE.PlaneGeometry( 300, 300 ), new THREE.MeshStandardMaterial( { color: 0xcbcbcb, depthWrite: true, roughness: 1, metalness: 0 } ) );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add( ground );

        const grid = new THREE.GridHelper(300, 300, 0x101010, 0x555555 );
        grid.name = "Grid";
        this.scene.add(grid);
       
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.01, 1000);
        this.camera.position.set(0,1.2,2);
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 1, 0);
        this.controls.enableDamping = true; // this requires controls.update() during application update
        this.controls.dampingFactor = 0.1;
        this.controls.enabled = true;
        this.controls.update();

        this.renderer.render( this.scene,this.camera );
        

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        let showControls = true;
        if(urlParams.has('controls')) {
            showControls = !(urlParams.get('controls') === "false");
        }
        let modelToLoad = ['https://webglstudio.org/3Dcharacters/Woman/Woman.glb', (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), 0 ) ];
        this.loadAvatar(modelToLoad[0], modelToLoad[1], "Woman", ()=>{
            this.changeSourceAvatar( "Woman" );                         
        });

        modelToLoad = ['https://webglstudio.org/3Dcharacters/ReadyEva/ReadyEva.glb', (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), 0 ) ];
        this.loadAvatar(modelToLoad[0], modelToLoad[1], "ReadyEva", ()=>{
            this.gui = new Gui( this ); 
            this.changeAvatar( "ReadyEva" );
            this.animate();
            document.getElementById("loading").style.display = "none";
            this.isAppReady = true;
                    
        });

        window.addEventListener( 'resize', this.onWindowResize.bind(this) );
    }

    animate() {

        requestAnimationFrame( this.animate.bind(this) );

        let delta = this.clock.getDelta()         
        delta *= this.speed;
        this.elapsedTime += delta;
        
        this.update(delta); 
        this.controls.update();
        this.renderer.render( this.scene, this.camera );
    }

    update( deltaTime ) {
        this.elapsedTime += deltaTime;
        if (this.playing) {
            if(this.mixer) { 
                this.mixer.update( deltaTime ); 
            }
            if(this.sourceMixer) {
                this.sourceMixer.update( deltaTime );
            }
        }
    }

    changeAvatar( avatarName ) {
        let current = this.loadedCharacters[this.currentCharacter];
        if ( current) {
            this.scene.remove( current.model ); // delete from scene current model
            this.scene.remove( current.skeletonHelper ); // delete skeleton helper from scene
        }
        
        this.currentCharacter = avatarName;
        const character =  this.loadedCharacters[this.currentCharacter];
        this.scene.add( character.model ); // add model to scene
        if(character.skeletonHelper) {
            character.skeletonHelper.visible = this.showSkeletons;
            this.scene.add( character.skeletonHelper ); // add skeleton helper to scene
        }
        character.model.position.x = 1;
        this.onChangeAvatar(avatarName);
        this.retargeting = null;

        if(this.currentSourceCharacter) {
                 }
        if ( this.gui ){ this.gui.refresh(); }
    }

    changeSourceAvatar( avatarName ) {
        let current = this.loadedCharacters[this.currentSourceCharacter];
        if ( current) {
            this.scene.remove( current.model ); // delete from scene current model
            this.scene.remove( current.skeletonHelper ); // delete skeleton helper from scene
        }
        
        this.currentSourceCharacter = avatarName;
        const character =  this.loadedCharacters[this.currentSourceCharacter];
        //character.model.position.x = -1;
        this.scene.add( character.model ); // add model to scene
        if(character.skeletonHelper) {
            character.skeletonHelper.visible = this.showSkeletons;
            this.scene.add( character.skeletonHelper ); // add skeleton helper to scene
        }
        //this.changePlayState(this.playing);
        this.sourceMixer = this.loadedCharacters[avatarName].mixer;  
        let animations = character.animations;
        if(animations && animations.length) {

            for(let i in animations) {
                const animation = animations[i];
                this.loadedAnimations[animation.name] = {
                    name: animation.name,
                    animation: animation,
                    skeleton: character.skeleton,
                    type: "bvhe"
                };
            }
        }
        this.currentAnimation = "";
        this.bindedAnimations = {};
       
        this.retargeting = null;
     
        if ( this.gui ){ this.gui.refresh(); }
    }

    loadAvatar( modelFilePath, modelRotation, avatarName, callback = null ) {
        this.loaderGLB.load( modelFilePath, (glb) => {
            let model = glb.scene;
            model.quaternion.premultiply( modelRotation );
            model.castShadow = true;
            let skeleton = null;
            let bones = [];
            if(avatarName == "Witch") {
                model.traverse( (object) => {
                    if ( object.isMesh || object.isSkinnedMesh ) {
                                          
                        if(!object.name.includes("Hat"))
                           object.material.side = THREE.FrontSide;
                        object.frustumCulled = false;
                        object.castShadow = true;
                        object.receiveShadow = true;
                        if (object.name == "Eyelashes") // eva
                        object.castShadow = false;
                        if(object.material.map) 
                        object.material.map.anisotropy = 16;
                        if(object.name == "Hair") {
                            object.material.map = null;
                            object.material.color.set(0x6D1881);
                        }
                        if(object.name.includes("Bottom")) {
                            object.material.map = null;
                            object.material.color.set(0x000000);
                        }
                        if(object.name.includes("Top")) {
                            object.material.map = null;
                            object.material.color.set(0x000000);
                        }
                        if(object.name.includes("Shoes")) {
                            object.material.map = null;
                            object.material.color.set(0x19A7A3);
                        }
                    } else if (object.isBone) {
                        object.scale.set(1.0, 1.0, 1.0);                    
                        bones.push(object);
                    }
                    if (object.skeleton){
                        skeleton = object.skeleton; 
                    }  
                } );
            }else{
                model.traverse( (object) => {
                    if ( object.isMesh || object.isSkinnedMesh ) {                        
                        object.material.side = THREE.FrontSide;
                        object.frustumCulled = false;
                        object.castShadow = true;
                        object.receiveShadow = true;
                        if (object.name == "Eyelashes") // eva
                            object.castShadow = false;
                        if(object.material.map) 
                            object.material.map.anisotropy = 16;
                    } else if(object.isBone) {
                        bones.push(object);
                    }                               
                    if (object.skeleton){
                        skeleton = object.skeleton;                         
                    }
                } );
    
            }

            if ( avatarName == "Kevin" ){
                let hair = model.getObjectByName( "Classic_short" );
                if( hair && hair.children.length > 1 ){ hair.children[1].renderOrder = 1; }
            }
                        
            model.name = avatarName;
            
            let animations = glb.animations;
            // if(skeleton.bones[0].parent && skeleton.bones[0].parent != model) {
            //     model.position.copy(skeleton.bones[0].parent.position);
            //     model.rotation.copy(skeleton.bones[0].parent.rotation);
            //     model.scale.copy(skeleton.bones[0].parent.scale);
            //     model.updateWorldMatrix(false, true);

            //     skeleton.bones[0].parent.position.set(0,0,0);
            //     skeleton.bones[0].parent.rotation.set(0,0,0);
            //     skeleton.bones[0].parent.scale.set(1,1,1);
            //     skeleton.bones[0].parent.updateWorldMatrix(false, true);

            // }
            // if(skeleton.bones[0].parent) {
            //     skeleton.bones[0].parent.matrix.decompose(skeleton.bones[0].position, skeleton.bones[0].quaternion, skeleton.bones[0].scale);
            //     skeleton.bones[0].updateWorldMatrix(true, true);
            // }
            if(!skeleton && bones.length) {
                skeleton = new THREE.Skeleton(bones);
                for(let i = 0; i < animations.length; i++) {
                    this.loadBVHAnimation(avatarName, {skeletonAnim :{skeleton, clip: animations[i]}}, i == (animations.length - 1) ? callback : null)
                }
                return;
            }
            let skeletonHelper = new THREE.SkeletonHelper(skeleton.bones[0]);
            this.loadedCharacters[avatarName] ={
                model, skeleton, animations, skeletonHelper
            }
            
            this.onLoadAvatar(model, avatarName);
            if (callback) {
                callback(animations);
            }
       
        });
    }

    loadAnimation( modelFilePath, avatarName, callback = null ) {
        
        const data = this.loaderBVH.parseExtended(modelFilePath);
        this.loadBVHAnimation( avatarName, data, callback );     
    } 

    changePlayState(state = !this.playing) {
        this.playing = state;
        if(this.playing && this.mixer) {
            this.mixer.setTime(0);                      
        }
        if(this.playing && this.sourceMixer) {
            this.sourceMixer.setTime(0);                      
        }
    }

    changeSkeletonsVisibility(visibility) {
        this.showSkeletons = visibility;
        
        if(this.currentSourceCharacter && this.loadedCharacters[this.currentSourceCharacter].skeletonHelper) {
            this.loadedCharacters[this.currentSourceCharacter].skeletonHelper.visible = visibility;
        }
        if(this.currentCharacter) {
            this.loadedCharacters[this.currentCharacter].skeletonHelper.visible = visibility;
        }
        this.scene.getObjectByName("Grid").visible = visibility;
    }

    onLoadAvatar(newAvatar, name){      
        // Create mixer for animation
        const mixer = new THREE.AnimationMixer(newAvatar);  
        this.loadedCharacters[name].mixer = mixer;
    }

    onChangeAvatar(avatarName) {
        if (!this.loadedCharacters[avatarName]) { 
            return false; 
        }
        this.currentCharacter = avatarName;
        this.changePlayState(this.playing);
        this.mixer = this.loadedCharacters[avatarName].mixer;  
        this.bindAnimationToCharacter(this.currentAnimation, avatarName);
        return true;
    }
    

    onChangeAnimation(animationName) {
        if(!this.loadedAnimations[animationName]) {
            console.warn(animationName + 'not found')
        }
        if(this.currentAnimation) {
            this.sourceMixer.uncacheClip(this.loadedAnimations[this.currentAnimation].animation);
        }
        this.sourceMixer.clipAction(this.loadedAnimations[animationName].animation).setEffectiveWeight(1.0).play();
        this.sourceMixer.setTime(0);
        this.currentAnimation = animationName;
        this.bindAnimationToCharacter(this.currentAnimation, this.currentCharacter);        
    }

    onWindowResize() {
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    // load animation from bvhe file
    loadBVHAnimation(name, animationData, callback) { 

        let skeleton = null;
        let bodyAnimation = null;
        let faceAnimation = null;
        if ( animationData && animationData.skeletonAnim ){
            skeleton = animationData.skeletonAnim.skeleton;
            skeleton.bones.forEach( b => { b.name = b.name.replace( /[`~!@#$%^&*()|+\-=?;:'"<>\{\}\\\/]/gi, "") } );
            // loader does not correctly compute the skeleton boneInverses and matrixWorld 
            skeleton.bones[0].updateWorldMatrix( false, true ); // assume 0 is root
            skeleton = new THREE.Skeleton( skeleton.bones ); // will automatically compute boneInverses
            
            animationData.skeletonAnim.clip.tracks.forEach( b => { b.name = b.name.replace( /[`~!@#$%^&*()|+\-=?;:'"<>\{\}\\\/]/gi, "") } );     
            animationData.skeletonAnim.clip.name = name;
            bodyAnimation = animationData.skeletonAnim.clip;
        }
        
        if ( animationData && animationData.blendshapesAnim ){
            animationData.blendshapesAnim.clip.name = "faceAnimation";       
            faceAnimation = animationData.blendshapesAnim.clip;
        }

        this.loadedAnimations[name] = {
            name: name,
            animation: bodyAnimation ?? new THREE.AnimationClip( "bodyAnimation", -1, [] ),
            faceAnimation,
            skeleton,
            type: "bvhe"
        };

        let boneContainer = new THREE.Group();
        boneContainer.add( skeleton.bones[0] );
        boneContainer.position.x = -1;
        boneContainer.name = "Armature";
        this.scene.add( boneContainer );
        let skeletonHelper = new THREE.SkeletonHelper(boneContainer);
        skeletonHelper.name = name;
        skeletonHelper.skeleton = skeleton;
        skeletonHelper.changeColor( 0xFF0000, 0xFFFF00 );
        
        this.loadedCharacters[name] ={
            model: skeletonHelper, skeleton, animations: [this.loadedAnimations[name].animation]
        }
        this.onLoadAvatar(skeletonHelper, name);
        if (callback) {
            callback(this.loadedCharacters[name].animations);
        }
    }

    /**
     * KeyframeEditor: fetches a loaded animation and applies it to the character. The first time an animation is binded, it is processed and saved. Afterwards, this functino just changes between existing animations 
     * @param {String} animationName 
     * @param {String} characterName 
     */
    bindAnimationToCharacter(animationName, characterName) {
        
        let animationData = this.loadedAnimations[animationName];
        if(!animationData) {
            console.warn(animationName + " not found");
            return false;
        }
        this.currentAnimation = animationName;
        
        let currentCharacter = this.loadedCharacters[characterName];
        if(!currentCharacter) {
            console.warn(characterName + ' not loaded')
        }
        // Remove current animation clip
        let mixer = currentCharacter.mixer;
        mixer.stopAllAction();

        while(mixer._actions.length){
            mixer.uncacheClip(mixer._actions[0]._clip); // removes action
        }
        //currentCharacter.skeleton.pose(); // for some reason, mixer.stopAllAction makes bone.position and bone.quaternions undefined. Ensure they have some values

        // if not yet binded, create it. Otherwise just change to the existing animation
        if ( !this.bindedAnimations[animationName] || !this.bindedAnimations[animationName][currentCharacter.name] ) {
            let bodyAnimation = animationData.animation;        
            if(bodyAnimation) {
            
                let tracks = [];        
                // Remove position changes (only keep i == 0, hips)
                for (let i = 0; i < bodyAnimation.tracks.length; i++) {

                    if(!bodyAnimation.tracks[i].name.includes("Hips") && bodyAnimation.tracks[i].name.includes('position')) {
                        continue;
                    }
                    tracks.push(bodyAnimation.tracks[i]);
                    tracks[tracks.length - 1].name = tracks[tracks.length - 1].name.replace( /[\[\]`~!@#$%^&*()|+\-=?;:'"<>\{\}\\\/]/gi, "").replace(".bones", "");
                }

                bodyAnimation.tracks = tracks;  
                if( this.retargeting )
                {
                    bodyAnimation = this.retargeting.retargetAnimation(bodyAnimation);
                }
                
                this.validateAnimationClip(bodyAnimation);

                bodyAnimation.name = animationName;   // mixer
            }                
            
            if(!this.bindedAnimations[animationName]) {
                this.bindedAnimations[animationName] = {};
            }
            this.bindedAnimations[animationName][this.currentCharacter] = bodyAnimation;
            
        }

        let bindedAnim = this.bindedAnimations[animationName][this.currentCharacter];
        // mixer.clipAction(bindedAnim.mixerFaceAnimation).setEffectiveWeight(1.0).play(); // already handles nulls and undefines
        mixer.clipAction(bindedAnim).setEffectiveWeight(1.0).play();
        mixer.update(0);
        this.duration = bindedAnim.duration;
        this.mixer = mixer;

        return true;
    }

    /** Validate body animation clip created using ML */
    validateAnimationClip(clip) {

        let newTracks = [];
        let tracks = clip.tracks;
        let bones = this.loadedCharacters[this.currentCharacter].skeleton.bones;
        let bonesNames = [];
        tracks.map((v) => { bonesNames.push(v.name.split(".")[0])});

        for(let i = 0; i < bones.length; i++)
        {
            
            let name = bones[i].name;
            if(bonesNames.indexOf( name ) > -1)
                continue;
            let times = [0];
            let values = [bones[i].quaternion.x, bones[i].quaternion.y, bones[i].quaternion.z, bones[i].quaternion.w];
            
            let track = new THREE.QuaternionKeyframeTrack(name + '.quaternion', times, values);
            newTracks.push(track);
            
        }
        clip.tracks = clip.tracks.concat(newTracks);
    }

    applyOriginalBindPose(characterName) {

        let skeleton = this.loadedCharacters[characterName].skeleton;
        skeleton.pose();
        if ( skeleton.bones[0].parent ) {

            skeleton.bones[0].matrix.copy( skeleton.bones[0].parent.matrixWorld ).invert();
            skeleton.bones[0].matrix.multiply( skeleton.bones[0].matrixWorld );
            skeleton.bones[0].matrix.decompose( skeleton.bones[0].position, skeleton.bones[0].quaternion, skeleton.bones[0].scale );
        } 
    }

    applyRetargeting(srcEmbedWorldTransforms = true, trgEmbedWorldTransforms = true) {
        const source = this.loadedCharacters[this.currentSourceCharacter];
        const target = this.loadedCharacters[this.currentCharacter];
        
        this.retargeting = new AnimationRetargeting(source.skeleton, target.model, { srcPoseMode: AnimationRetargeting.BindPoseModes.TPOSE, trgPoseMode: AnimationRetargeting.BindPoseModes.TPOSE, srcEmbedWorldTransforms, trgEmbedWorldTransforms } ); // TO DO: change trgUseCurrentPose param
        
        if(this.currentAnimation) {
            this.bindAnimationToCharacter(this.currentAnimation, this.currentCharacter);
            this.sourceMixer.setTime(0.01);
            this.sourceMixer.setTime(0.0);
            this.mixer.setTime(0);
        }
        else {
           // this.retargeting.retargetPose();
        }
    }

    exportRetargetAnimation(filename, animation, format) {

        const innerDownload = function(filename, stringData, type = "text/plain") {
            let file = new Blob([stringData], {type: type});
            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            else { // Others
                let a = document.createElement("a");
                let url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                a.click();
                setTimeout(function() {
                    window.URL.revokeObjectURL(url);  
                }, 0); 
            }
        }
        let action = this.mixer.clipAction(animation)
        if(format == 'bvh') {
            const stringData = BVHExporter.export(action, this.loadedCharacters[this.currentCharacter].skeleton, animation);
            innerDownload(filename + ".bvh", stringData);
        }
        else {
            let options = {animations: [this.bindedAnimations[this.currentAnimation][this.currentCharacter]], binary: true }
            this.GLTFExporter.parse(this.loadedCharacters[this.currentCharacter].model.children[0], 
                ( gltf ) => innerDownload(filename + '.glb', gltf, 'application/octet-stream' ), // called when the gltf has been generated
                ( error ) => { console.log( 'An error happened:', error ); }, // called when there is an error in the generation
                options
            );
        }
    }

    resize(width, height) {
        const aspect = width / height;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}
    
export {App}

const app = new App();
app.init();
window.app = app;

 // ADDON SkeletonHelper

 THREE.SkeletonHelper.prototype.changeColor = function ( a, b ) {

       //Change skeleton helper lines colors
       let colorArray = this.geometry.attributes.color.array;
       for(let i = 0; i < colorArray.length; i+=6) { 
           colorArray[i+3] = 58/256; 
           colorArray[i+4] = 161/256; 
           colorArray[i+5] = 156/256;
       }
       this.geometry.attributes.color.array = colorArray;
       this.material.linewidth = 3;
}
