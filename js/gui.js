import * as THREE from 'three';

import { LX } from 'lexgui';
import 'lexgui/components/codeeditor.js';

class Gui {
    constructor( app ){
        this.app = app;
        
        // available model models paths - [model, config, rotation]
        this.avatarOptions = {
            "Eva": ['https://webglstudio.org/3Dcharacters/Eva/Eva.glb', 'https://webglstudio.org/3Dcharacters/Eva/Eva.json', 0, 'https://webglstudio.org/3Dcharacters/Eva/Eva.png'],
            "EvaLow": ['https://webglstudio.org/3Dcharacters/Eva_Low/Eva_Low.glb', 'https://webglstudio.org/3Dcharacters/Eva_Low/Eva_Low.json', 0, 'https://webglstudio.org/3Dcharacters/Eva_Low/Eva_Low.png'],
            "ReadyEva": ['https://webglstudio.org/3Dcharacters/ReadyEva/ReadyEva.glb', 'https://webglstudio.org/3Dcharacters/ReadyEva/ReadyEva.json', 0, 'https://webglstudio.org/3Dcharacters/ReadyEva/ReadyEva.png'],
            "Witch": ['https://webglstudio.org/3Dcharacters/Eva_Witch/Eva_Witch.glb', 'https://webglstudio.org/3Dcharacters/Eva_Witch/Eva_Witch.json', 0, 'https://webglstudio.org/3Dcharacters/Eva_Witch/Eva_Witch.png'],
            "Kevin": ['https://webglstudio.org/3Dcharacters/Kevin/Kevin.glb', 'https://webglstudio.org/3Dcharacters/Kevin/Kevin.json', 0, 'https://webglstudio.org/3Dcharacters/Kevin/Kevin.png'],
            "Ada": ['https://webglstudio.org/3Dcharacters/Ada/Ada.glb', 'https://webglstudio.org/3Dcharacters/Ada/Ada.json',0, 'https://webglstudio.org/3Dcharacters/Ada/Ada.png'],
            "Woman": ['https://webglstudio.org/3Dcharacters/Woman/Woman.gltf', 'https://webglstudio.org/3Dcharacters/Woman/Woman.json',0, 'https://webglstudio.org/3Dcharacters/Woman/Woman.png']
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

            p.sameLine();
            let avatars = [];
            for(let avatar in this.avatarOptions) {
                avatars.push({ value: avatar, src: this.avatarOptions[avatar][3] ?? "data/imgs/monster.png"});
            }
            this.panel.refresh = () =>{
                this.panel.clear();
                // SOURCE AVATAR/ANIMATION
                p.addDropdown("Source", avatars, this.app.currentSourceCharacter, (value, event) => {
                    
                    // upload model
                    if (value == "Upload Avatar") {
                        this.uploadAvatar((value) => {
                            
                            if ( !this.app.loadedCharacters[value] ) {
                                document.getElementById("loading").style.display = "block";

                                let modelFilePath = this.avatarOptions[value][0]; 
                                let configFilePath = this.avatarOptions[value][1]; 
                                let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][2] ); 
                                this.app.loadAvatar(modelFilePath, configFilePath, modelRotation, value, ()=>{ 
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
                            let configFilePath = this.avatarOptions[value][1]; 
                            let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][2] ); 
                            this.app.loadAvatar(modelFilePath, configFilePath, modelRotation, value, ()=>{ 
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

                p.addButton( null, "Upload Avatar", (v) => {
                    this.uploadAvatar((value) => {
                            
                        if ( !this.app.loadedCharacters[value] ) {
                            document.getElementById("loading").style.display = "block";
                            let modelFilePath = this.avatarOptions[value][0]; 
                            let configFilePath = this.avatarOptions[value][1]; 
                            let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][2] ); 
                            this.app.loadAvatar(modelFilePath, configFilePath, modelRotation, value, ()=>{ 
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
                p.endLine();
                if(this.app.currentSourceCharacter) {
                    p.addButton(null, "Apply retargeting", () => {
                        this.app.applyRetargeting();
                    })
                }
                                
                p.sameLine();
                // TARGET AVATAR
                p.addDropdown("Target avatar", avatars, this.app.currentCharacter, (value, event) => {
                    
                    // upload model
                    if (value == "Upload Avatar") {
                        this.uploadAvatar((value) => {
                            
                            if ( !this.app.loadedCharacters[value] ) {
                                document.getElementById("loading").style.display = "block";

                                let modelFilePath = this.avatarOptions[value][0]; 
                                let configFilePath = this.avatarOptions[value][1]; 
                                let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][2] ); 
                                this.app.loadAvatar(modelFilePath, configFilePath, modelRotation, value, ()=>{ 
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
                            let configFilePath = this.avatarOptions[value][1]; 
                            let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][2] ); 
                            this.app.loadAvatar(modelFilePath, configFilePath, modelRotation, value, ()=>{ 
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

                p.addButton( null, "Upload Avatar", (v) => {
                    this.uploadAvatar((value) => {
                            
                        if ( !this.app.loadedCharacters[value] ) {
                            document.getElementById("loading").style.display = "block";
                            let modelFilePath = this.avatarOptions[value][0]; 
                            let configFilePath = this.avatarOptions[value][1]; 
                            let modelRotation = (new THREE.Quaternion()).setFromAxisAngle( new THREE.Vector3(1,0,0), this.avatarOptions[value][2] ); 
                            this.app.loadAvatar(modelFilePath, configFilePath, modelRotation, value, ()=>{ 
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
                
                p.endLine();
              
                // if(this.app.currentSourceCharacter) {

                //     p.addButton(null, "Apply original bind position", () => {
                //         let character = this.app.loadedCharacters[this.app.currentCharacter];
                //         character.skeleton = character.bindSkeleton;
                //         character.skeleton.update();
                //     })
                // }
                p.addCheckbox("Show skeleton", this.app.showSkeletons, (v) => {
                    this.app.changeSkeletonsVisibility(v);
                })

                p.branch("Animation", {icon: "fa-solid fa-hands-asl-interpreting"});
                
                this.createKeyframePanel(p);
                
                p.merge();
            }

            this.panel.refresh();           

        }, { size: ["20%", null], float: "left", draggable: false });
        
        
        if ( window.innerWidth < window.innerHeight || pocketDialog.title.offsetWidth > (0.21*window.innerWidth) ){
            pocketDialog.title.click();
        }

    }

    createKeyframePanel(panel) {
      
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
        let name, model, config;
        let rotation = 0;
    
        this.avatarDialog = new LX.Dialog("Upload Avatar", panel => {
            
            let nameWidget = panel.addText("Name Your Avatar", name, (v, e) => {
                if (this.avatarOptions[v]) LX.popup("This avatar name is taken. Please, change it.", null, { position: ["45%", "20%"]});
                name = v;
            });

            let avatarFile = panel.addFile("Avatar File", (v, e) => {
                let files = panel.widgets["Avatar File"].domEl.children[1].files;
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
            
            let configFile = panel.addFile("Config File", (v, e) => {
               
                let extension = panel.widgets["Config File"].domEl.children[1].files[0].name.split(".")[1];
                if (extension == "json") { config = JSON.parse(v); }
                else { LX.popup("Config file must be a JSON!"); }
            }, {type: "text"});
            
            panel.addNumber("Apply Rotation", 0, (v) => {
                rotation = v * Math.PI / 180;
            }, { min: -180, max: 180, step: 1 } );
            
            panel.sameLine(2);
            panel.addButton(null, "Create Config File", () => {
                window.open("https://webglstudio.org/projects/signon/performs-atelier", '_blank').focus();
            })
            panel.addButton(null, "Upload", () => {
                if (name && model && config) {
                    if (this.avatarOptions[name]) { LX.popup("This avatar name is taken. Please, change it.", null, { position: ["45%", "20%"]}); return; }
                    this.avatarOptions[name] = [model, config, rotation, "data/imgs/monster.png"];
                    
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
                    else if (extension == "json") { 
                        // Create a data transfer object
                        const dataTransfer = new DataTransfer();
                        // Add file to the file list of the object
                        dataTransfer.items.add(files[i]);
                        // Save the file list to a new variable
                        const fileList = dataTransfer.files;
                        configFile.domEl.children[1].files = fileList;
                        configFile.domEl.children[1].dispatchEvent(new Event('change'), { bubbles: true });

                        //config = JSON.parse(files[i]); 
                    }
                }
            })

        }, { size: ["40%"], closable: true, onclose: (root) => { root.remove(); this.gui.setValue("Avatar File", this.app.currentCharacter)} });

        return name;
    }
}

export {Gui}