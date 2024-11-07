import * as THREE from 'three';


const _vector = /*@__PURE__*/ new THREE.Vector3();
const _boneMatrix = /*@__PURE__*/ new THREE.Matrix4();
const _matrixWorldInv = /*@__PURE__*/ new THREE.Matrix4();


class SkeletonHelper extends THREE.Group {

	constructor( object, color = new THREE.Color().setHex(0xffffff) ) {

		super()
		const bones = getBoneList( object );

		const geometry = new THREE.ConeGeometry( 0.02, 1, 3 );
        const material = new THREE.MeshPhongMaterial( {color: new THREE.Color().setHex(0xffffff), toneMapped: false} ); //, depthTest: false, depthWrite: false, toneMapped: false, transparent: true
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, bones.length);
        this.add(this.instancedMesh)
		this.isSkeletonHelper = true;

		this.type = 'SkeletonHelper';

		this.root = object;
		this.bones = bones;
		this.color = color;
        
		this.matrixAutoUpdate = false;

		for(let i = 0; i < bones.length; i++) {
			this.instancedMesh.setColorAt(i, color);
		}
	}

	updateMatrixWorld( force ) {

		const bones = this.bones;
	
		_matrixWorldInv.copy( this.root.matrixWorld ).invert();

		for ( let i = 0; i < bones.length; i ++ ) {

			const bone = bones[ i ];
            _boneMatrix.copy(bone.matrixWorld);
			if ( bone.children.length && bone.children[0].isBone ) {
                
                let position = _vector.clone();
				position.setFromMatrixPosition( _boneMatrix );
                
				let childPos = _vector.clone();
				childPos.setFromMatrixPosition( bone.children[0].matrixWorld );

                let q = new THREE.Quaternion();
				_vector.subVectors(childPos, position);
				let dir = _vector.clone();
				q.setFromUnitVectors(new THREE.Vector3(0,1,0),_vector.normalize());

                let len = Math.abs(position.distanceTo(childPos));
				let scale = _vector.clone();
                //_boneMatrix.decompose(position, q, scale);
				scale.x = 6*len;
                scale.y = len;
                scale.z = 6*len;

                position.addScaledVector(dir, 0.5)
                _boneMatrix.compose( position, q, scale);
			}
            else {
				let position = _vector.clone();
				let scale = _vector.clone();
				let q = new THREE.Quaternion();

                _boneMatrix.decompose(position, q, scale);

				scale.x = 0.2;
				scale.y = 0.03;
				scale.z = 0.2;
                _boneMatrix.compose( position, q, scale);
            }
            this.instancedMesh.setMatrixAt(i, _boneMatrix);
		}
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.computeBoundingSphere();

	}

	dispose() {

		// this.geometry.dispose();
		// this.material.dispose();

	}

}


function getBoneList( object ) {

	const boneList = [];

	if ( object.isBone === true ) {

		boneList.push( object );

	}

	for ( let i = 0; i < object.children.length; i ++ ) {

		boneList.push.apply( boneList, getBoneList( object.children[ i ] ) );

	}

	return boneList;

}


export { SkeletonHelper };