import * as THREE from 'three';

import { LX } from 'lexgui';
import 'lexgui/components/codeeditor.js';

class Gui {
    constructor( app ){
        this.app = app;
        
        // available model models paths - [model, rotation]
        this.avatarOptions = {
            "Eva": ['https://webglstudio.org/3Dcharacters/Eva/Eva.glb', 0, 'https://webglstudio.org/3Dcharacters/Eva/Eva.png'],
            "EvaLow": ['https://webglstudio.org/3Dcharacters/Eva_Low/Eva_Low.glb', 0, 'https://webglstudio.org/3Dcharacters/Eva_Low/Eva_Low.png'],
            "ReadyEva": ['https://webglstudio.org/3Dcharacters/ReadyEva/ReadyEva.glb', 0, 'https://webglstudio.org/3Dcharacters/ReadyEva/ReadyEva.png'],
            "Witch": ['https://webglstudio.org/3Dcharacters/Eva_Witch/Eva_Witch.glb', 0, 'https://webglstudio.org/3Dcharacters/Eva_Witch/Eva_Witch.png'],
            "Kevin": ['https://webglstudio.org/3Dcharacters/Kevin/Kevin.glb', 0, 'https://webglstudio.org/3Dcharacters/Kevin/Kevin.png'],
            "Ada": ['https://webglstudio.org/3Dcharacters/Ada/Ada.glb', 0, 'https://webglstudio.org/3Dcharacters/Ada/Ada.png'],
            "Woman": ['https://webglstudio.org/3Dcharacters/Woman/Woman.gltf', 0, 'https://webglstudio.org/3Dcharacters/Woman/Woman.png']
        }

        // take canvas from dom, detach from dom, attach to lexgui 
        this.app.renderer.domElement.remove(); // removes from dom
        let main_area = LX.init();
        main_area.attach( this.app.renderer.domElement );

        main_area.root.ondrop = (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.app.loadFiles(e.dataTransfer.files, () => this.gui.refresh());      
        };    
        this.panel = null;

        this.createPanel();
    }

    refresh(){
        this.panel.refresh();
    }

    createPanel(){

        let pocketDialog = new LX.PocketDialog( "Controls", p => {
            this.panel = p;
           
            let avatars = [];
            for(let avatar in this.avatarOptions) {
                avatars.push({ value: avatar, src: this.avatarOptions[avatar][2] ?? "data/imgs/monster.png"});
            }
            this.panel.refresh = () =>{
                this.panel.clear();
                this.createSourcePanel(this.panel, avatars);

                this.createTargetPanel(this.panel, avatars);
                // if(this.app.currentSourceCharacter) {

                //     p.addButton(null, "Apply original bind position", () => {
                //         let character = this.app.loadedCharacters[this.app.currentCharacter];
                //         character.skeleton = character.bindSkeleton;
                //         character.skeleton.update();
                //     })
                // }                                
                
                p.addCheckbox("Show skeletons", this.app.showSkeletons, (v) => {
                    this.app.changeSkeletonsVisibility(v);
                })

                if(this.app.currentSourceCharacter) {
                    p.addButton(null, "Apply retargeting", () => {
                        this.app.applyRetargeting();
                    }, { width: "200px"})
                }
                
            }

            this.panel.refresh();           

        }, { size: ["20%", null], float: "left", draggable: false });
        
        
        if ( window.innerWidth < window.innerHeight || pocketDialog.title.offsetWidth > (0.21*window.innerWidth) ){
            pocketDialog.title.click();
        }

    }

    createSourcePanel(panel, avatars) {
        // SOURCE AVATAR/ANIMATION
        panel.branch("Source", {icon: "fa-solid fa-child-reaching"});

        panel.sameLine();
        panel.addDropdown("Source", avatars, this.app.currentSourceCharacter, (value, event) => {
            
            // upload model
            if (value == "Upload Animation or Avatar") {
                this.uploadAvatar((value) => {
                    
                    if ( !this.app.loadedCharacters[value] ) {
                        document.getElementById("loading").style.display = "block";

                        let modelFilePath = this.avatarOptions[value][0]; 
                        let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][1] ); 
                        this.app.loadAvatar(modelFilePath, modelRotation, value, ()=>{ 
                            avatars.push({ value: value, src: "data/imgs/monster.png"});
                            this.app.changeSourceAvatar(value);
                            document.getElementById("loading").style.display = "none";
                        } );
                        return;
                    } 

                    // use controller if it has been already loaded in the past
                    this.app.changeSourceAvatar(value);
                    // TO  DO: load animations if it has someone

                });
            }
            else {
                // load desired model
                if ( !this.app.loadedCharacters[value] ) {
                    document.getElementById("loading").style.display = "block";
                    let modelFilePath = this.avatarOptions[value][0]; 
                    let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][1] ); 
                    this.app.loadAvatar(modelFilePath, modelRotation, value, ()=>{ 
                        this.app.changeSourceAvatar(value);
                        // TO  DO: load animations if it has someone
                        document.getElementById("loading").style.display = "none";
                    } );
                    return;
                } 
                // use controller if it has been already loaded in the past
                this.app.changeSourceAvatar(value);
            }
        });

        panel.addButton( null, "Upload Animation or Avatar", (v) => {
            this.uploadAvatar((value) => {
                    
                if ( !this.app.loadedCharacters[value] ) {
                    document.getElementById("loading").style.display = "block";
                    let modelFilePath = this.avatarOptions[value][0]; 
                    let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][1] ); 
                    this.app.loadAvatar(modelFilePath, modelRotation, value, ()=>{ 
                        avatars.push({ value: value, src: "data/imgs/monster.png"});
                        this.app.changeSourceAvatar(value);
                        document.getElementById("loading").style.display = "none";
                        // TO  DO: load animations if it has someone

                    } );
                    return;
                } 

                // use controller if it has been already loaded in the past
                this.app.changeSourceAvatar(value);

            });
        } ,{ width: "40px", icon: "fa-solid fa-cloud-arrow-up" } );
        
        panel.endLine();
        this.createKeyframePanel(panel);

        panel.merge();
    }

    createTargetPanel(panel, avatars) {
        // TARGET AVATAR
        panel.branch("Target", {icon: "fa-solid fa-people-arrows"});
        panel.sameLine();
        panel.addDropdown("Target avatar", avatars, this.app.currentCharacter, (value, event) => {
            
            // upload model
            if (value == "Upload Avatar") {
                this.uploadAvatar((value) => {
                    
                    if ( !this.app.loadedCharacters[value] ) {
                        document.getElementById("loading").style.display = "block";

                        let modelFilePath = this.avatarOptions[value][0]; 
                        let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][1] ); 
                        this.app.loadAvatar(modelFilePath, modelRotation, value, ()=>{ 
                            avatars.push({ value: value, src: "data/imgs/monster.png"});
                            this.app.changeAvatar(value);
                            document.getElementById("loading").style.display = "none";
                        } );
                        return;
                    } 

                    // use controller if it has been already loaded in the past
                    this.app.changeAvatar(value);
                    // TO  DO: load animations if it has someone

                });
            }
            else {
                // load desired model
                if ( !this.app.loadedCharacters[value] ) {
                    document.getElementById("loading").style.display = "block";
                    let modelFilePath = this.avatarOptions[value][0]; 
                    let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][1] ); 
                    this.app.loadAvatar(modelFilePath, modelRotation, value, ()=>{ 
                        avatars.push({ value: value, src: "data/imgs/monster.png"});
                        this.app.changeAvatar(value);
                        // TO  DO: load animations if it has someone
                        document.getElementById("loading").style.display = "none";
                    } );
                    return;
                } 

                // use controller if it has been already loaded in the past
                this.app.changeAvatar(value);
            }
        });

        panel.addButton( null, "Upload Avatar", (v) => {
            this.uploadAvatar((value) => {
                    
                if ( !this.app.loadedCharacters[value] ) {
                    document.getElementById("loading").style.display = "block";
                    let modelFilePath = this.avatarOptions[value][0]; 
                    let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][1] ); 
                    this.app.loadAvatar(modelFilePath, modelRotation, value, ()=>{ 
                        avatars.push({ value: value, src: "data/imgs/monster.png"});
                        this.app.changeAvatar(value);
                        document.getElementById("loading").style.display = "none";
                        // TO  DO: load animations if it has someone

                    } );
                    return;
                } 

                // use controller if it has been already loaded in the past
                this.app.changeAvatar(value);

            });
        } ,{ width: "40px", icon: "fa-solid fa-cloud-arrow-up" } );
        
        if(this.app.currentSourceCharacter && this.app.currentCharacter) {

            panel.addButton(null, "Edit mapping", () => {
                this.showBoneMapping();
            }, {width: "40px", icon: "fa-solid fa-bone"});
        }
        panel.endLine();
        panel.merge();
    }

    createKeyframePanel(panel) {
        panel.addTitle("Animation", {icon: "fa-solid fa-hands-asl-interpreting"});
        panel.sameLine();
        panel.addDropdown("Animation", Object.keys(this.app.loadedAnimations), this.app.currentAnimation, (v) => {
            this.app.onChangeAnimation(v);
        });

        panel.addButton("", "<i class='fa fa-solid " + (this.app.playing ? "fa-stop'>": "fa-play'>") + "</i>", (v,e) => {
            this.app.changePlayState();
            panel.refresh();
        }, { width: "40px"});
        panel.endLine(); 
    }

    uploadAvatar(callback = null) {
        let name, model;
        let rotation = 0;
    
        this.avatarDialog = new LX.Dialog("Upload Animation/Avatar", panel => {
            
            let nameWidget = panel.addText("Name Your Source", name, (v, e) => {
                if (this.avatarOptions[v]) LX.popup("This name is taken. Please, change it.", null, { position: ["45%", "20%"]});
                name = v;
            });

            let avatarFile = panel.addFile("Animation/Avatar File", (v, e) => {
                let files = panel.widgets["Animation/avatar File"].domEl.children[1].files;
                if(!files.length) {
                    return;
                }
                const path = files[0].name.split(".");
                const filename = path[0];
                const extension = path[1];
                if (extension == "glb" || extension == "gltf") { 
                    model = v;
                    if(!name) {
                        name = filename;
                        nameWidget.set(name)
                    }
                }
                else { LX.popup("Only accepts GLB and GLTF formats!"); }
                
            }, {type: "url"});
            
            panel.addNumber("Apply Rotation", 0, (v) => {
                rotation = v * Math.PI / 180;
            }, { min: -180, max: 180, step: 1 } );
            
            panel.addButton(null, "Upload", () => {
                if (name && model) {
                    if (this.avatarOptions[name]) { LX.popup("This avatar name is taken. Please, change it.", null, { position: ["45%", "20%"]}); return; }
                    this.avatarOptions[name] = [model, rotation, "data/imgs/monster.png"];
                    
                    panel.clear();
                    this.avatarDialog.root.remove();
                    if (callback) callback(name);
                }
                else {
                    LX.popup("Complete all fields!", null, { position: ["45%", "20%"]});
                }
            });
            panel.root.addEventListener("drop", (v, e) => {

                let files = v.dataTransfer.files;
                if(!files.length) {
                    return;
                }
                for(let i = 0; i < files.length; i++) {

                    const path = files[i].name.split(".");
                    const filename = path[0];
                    const extension = path[1];
                    if (extension == "glb" || extension == "gltf") { 
                        // Create a data transfer object
                        const dataTransfer = new DataTransfer();
                        // Add file to the file list of the object
                        dataTransfer.items.add(files[i]);
                        // Save the file list to a new variable
                        const fileList = dataTransfer.files;
                        avatarFile.domEl.children[1].files = fileList;
                        avatarFile.domEl.children[1].dispatchEvent(new Event('change'), { bubbles: true });
                        model = v;
                        if(!name) {
                            name = filename;
                            nameWidget.set(name)
                        }
                    }
                }
            })

        }, { size: ["40%"], closable: true, onclose: (root) => { root.remove(); this.gui.setValue("Avatar File", this.app.currentCharacter)} });

        return name;
    }

    showBoneMapping() {
        let dialog = new LX.Dialog("Bone Mapping", panel => { 
            let htmlStr = "Select the corresponding bone name of your avatar to match the provided list of bone names. An automatic selection is done, adjust if needed.";
            panel.addTextArea(null, htmlStr, null, {disabled: true, fitHeight: true});
            const bones = this.app.loadedCharacters[this.app.currentCharacter].skeleton.bones;
            let bonesName = [];
            for(let i = 0; i < bones.length; i++) {
                bonesName.push(bones[i].name);
            }
            let i = 0;
            for (const part in this.app.retargeting.boneMap.nameMap) {
                if ((i % 2) == 0) panel.sameLine(2);
                i++;
                panel.addDropdown(part, bonesName, this.app.retargeting.boneMap.nameMap[part], (value, event) => {
                    this.app.retargeting.boneMap.nameMap[part] = value;
                    const srcIdx = findIndexOfBoneByName(this.app.retargeting.srcSkeleton, part);
                    this.app.retargeting.boneMap.idxMap[srcIdx] = i;
                    
                }, {filter: true});
            }
        }, { size: ["80%", "70%"], closable: true, onclose: () => {
            if(this.app.currentAnimation) {
                this.app.bindAnimationToCharacter(this.app.currentAnimation, this.app.currentCharacter);
            }
            dialog.panel.clear();
            dialog.root.remove();
        } });        
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

export {Gui}