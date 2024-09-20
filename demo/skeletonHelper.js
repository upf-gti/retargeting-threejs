import * as THREE from 'three';


const _vector = /*@__PURE__*/ new THREE.Vector3();
const _boneMatrix = /*@__PURE__*/ new THREE.Matrix4();
const _matrixWorldInv = /*@__PURE__*/ new THREE.Matrix4();


class SkeletonHelper extends THREE.Group {

	constructor( object ) {

		super()
		const bones = getBoneList( object );

		const geometry = new THREE.ConeGeometry( 0.01, 1, 3 );
        const material = new THREE.MeshBasicMaterial( {color: 0xffff00, depthTest: false, depthWrite: false, toneMapped: false, transparent: true} ); //, depthTest: false, depthWrite: false, toneMapped: false, transparent: true
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, bones.length);
        this.add(this.instancedMesh)
		this.isSkeletonHelper = true;

		this.type = 'SkeletonHelper';

		this.root = object;
		this.bones = bones;
        // object.getWorldPosition(this.position);
        // object.getWorldQuaternion(this.quaternion);
        // object.getWorldScale(this.scale);
        // this.updateMatrix();
		// this.matrix = object.matrixWorld;
		this.matrixAutoUpdate = false;

	}

	updateMatrixWorld( force ) {

		const bones = this.bones;
	
		_matrixWorldInv.copy( this.root.matrixWorld ).invert();

		for ( let i = 0, j = 0; i < bones.length; i ++ ) {

			const bone = bones[ i ];
            _boneMatrix.copy(bone.matrixWorld);
			if ( bone.parent && bone.parent.isBone ) {
                
            //     // let position = _vector.clone();
			// 	// _boneMatrix.multiplyMatrices( _matrixWorldInv, bone.matrixWorld );
            //     // _vector.setFromMatrixPosition( _boneMatrix );
			// 	// position.set( _vector.x, _vector.y, _vector.z );
			// 	// const pos = position.clone();
                
			// 	// _boneMatrix.multiplyMatrices( _matrixWorldInv, bone.parent.matrixWorld );
			// 	// _vector.setFromMatrixPosition( _boneMatrix );
			// 	// position.set( _vector.x, _vector.y, _vector.z );
            //     // const length = pos.distanceTo(position);
            //     // _boneMatrix.makeScale(1,length,1);
            //     // this.instancedMesh.setMatrixAt(i, _boneMatrix);
                let position = _vector.clone();
			// 	_boneMatrix.multiplyMatrices( _matrixWorldInv, bone.matrixWorld );
                _vector.setFromMatrixPosition( _boneMatrix );
				position.set( _vector.x, _vector.y, _vector.z );
				const pos = position.clone();
                
			// 	_boneMatrix.multiplyMatrices( _matrixWorldInv, bone.parent.matrixWorld );
				_vector.setFromMatrixPosition( bone.parent.matrixWorld );
				position.set( _vector.x, _vector.y, _vector.z );
                let len = Math.abs(pos.distanceTo(position));
                let q = new THREE.Quaternion();
                _boneMatrix.decompose(pos, q, _vector);
                _vector.y = len;
                
                let dir = new THREE.Vector3();
                // dir.subVectors(position,pos );
                // // dir.multiplyScalar(len*0.5);
                // // dir.multiplyVectors(dir, _vector);
                // pos.addScaledVector(dir, 0.5)
                _boneMatrix.compose( pos, q, _vector);
			}
            else {
                let position = _vector.clone();
                let q = new THREE.Quaternion();

                _boneMatrix.decompose(position, q, _vector);
                _vector.y = 0;
                _boneMatrix.compose( position, q, _vector);
            }
            this.instancedMesh.setMatrixAt(i, _boneMatrix);
		}
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.computeBoundingSphere();
		// geometry.getAttribute( 'position' ).needsUpdate = true;

		// super.updateMatrixWorld( force );

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