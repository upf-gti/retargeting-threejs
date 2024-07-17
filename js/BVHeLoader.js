import * as THREE from 'three';
import { BVHLoader } from 'https://cdn.skypack.dev/three@0.136/examples/jsm/loaders/BVHLoader.js';

// Overwrite/add methods

/*
	reads a string array (lines) from a BVHE file
	and outputs a skeleton structure including motion data

	returns thee root node:
	{ name: '', channels: [], children: [] }
*/
BVHLoader.prototype.parseExtended = function(text) {

	function readBvh( lines ) {

		// read model structure
		let boneRoot = null;
		const bonesList = []; // collects flat array of all bones

		let bs = null;
		let firstLine = nextLine( lines );

		if ( firstLine == 'HIERARCHY' ) {

			boneRoot = readNode( lines, nextLine( lines ), bonesList );
			firstLine = nextLine( lines );
			
			// read motion data
			if ( firstLine !== 'MOTION' ) {

				console.error( 'THREE.BVHLoader: MOTION expected.' );

			}

			// number of frames
			let tokens = nextLine( lines ).split( /[\s]+/ );
			const numFrames = parseInt( tokens[ 1 ] );

			if ( isNaN( numFrames ) ) {

				console.error( 'THREE.BVHLoader: Failed to read number of frames.' );
			}

			// frame time
			tokens = nextLine( lines ).split( /[\s]+/ );
			const frameTime = parseFloat( tokens[ 2 ] );

			if ( isNaN( frameTime ) ) {

				console.error( 'THREE.BVHLoader: Failed to read frame time.' );

			}

			// read frame data line by line /**CHANGE IT TO SUPPORT BLENDSHAPES ANIMATION */
			for ( let i = 0; i < numFrames; i ++ ) {

				tokens = nextLine( lines ).split( /[\s]+/ );
				if(boneRoot) {
					readFrameBoneData( tokens, i * frameTime, boneRoot );
				}
			}

		}

		if(lines.length > 1) {

			firstLine = nextLine( lines )
			if ( firstLine == 'BLENDSHAPES' )	{
				//console.error( 'THREE.BVHLoader: HIERARCHY expected.' );
				const bsList = []; // collects flat array of all blendshapes
				bs = readBlendshape( lines, nextLine( lines ), bsList );
				firstLine = nextLine( lines );

				// read motion data
				if ( firstLine !== 'MOTION' ) {
		
					console.error( 'THREE.BVHLoader: MOTION expected.' );
				}
		
				// number of frames
				let tokens = nextLine( lines ).split( /[\s]+/ );
				const numFrames = parseInt( tokens[ 1 ] );
		
				if ( isNaN( numFrames ) ) {
		
					console.error( 'THREE.BVHLoader: Failed to read number of frames.' );
		
				}
		
				// frame time
				tokens = nextLine( lines ).split( /[\s]+/ );
				const frameTime = parseFloat( tokens[ 2 ] );
		
				if ( isNaN( frameTime ) ) {
		
					console.error( 'THREE.BVHLoader: Failed to read frame time.' );
		
				}
		
				// read frame data line by line /**CHANGE IT TO SUPPORT BLENDSHAPES ANIMATION */
		
				for ( let i = 0; i < numFrames; i ++ ) {
		
					tokens = nextLine( lines ).split( /[\s]+/ );
					if(bs) {
						readFrameBSData( tokens, i * frameTime, bs );
					}
	
				}
			}
			
		}

		return {bones: bonesList, blendshapes: bs};
	}

	/*
		Recursively reads data from a single frame into the bone hierarchy.
		The passed bone hierarchy has to be structured in the same order as the BVH file.
		keyframe data is stored in bone.frames.

		- data: splitted string array (frame values), values are shift()ed so
		this should be empty after parsing the whole hierarchy.
		- frameTime: playback time for this keyframe.
		- bone: the bone to read frame data from.
	*/
	function readFrameBoneData( data, frameTime, bone ) {

		// end sites have no motion data

		if ( bone.type === 'ENDSITE' ) return;

		// add keyframe

		const keyframe = {
			time: frameTime,
			position: new THREE.Vector3(),
			rotation: new THREE.Quaternion()
		};

		bone.frames.push( keyframe );

		const quat = new THREE.Quaternion();

		const vx = new THREE.Vector3( 1, 0, 0 );
		const vy = new THREE.Vector3( 0, 1, 0 );
		const vz = new THREE.Vector3( 0, 0, 1 );

		// parse values for each channel in node

		for ( let i = 0; i < bone.channels.length; i ++ ) {

			switch ( bone.channels[ i ] ) {

				case 'Xposition':
					keyframe.position.x = parseFloat( data.shift().trim() );
					break;
				case 'Yposition':
					keyframe.position.y = parseFloat( data.shift().trim() );
					break;
				case 'Zposition':
					keyframe.position.z = parseFloat( data.shift().trim() );
					break;
				case 'Xrotation':
					quat.setFromAxisAngle( vx, parseFloat( data.shift().trim() ) * Math.PI / 180 );
					keyframe.rotation.multiply( quat );
					break;
				case 'Yrotation':
					quat.setFromAxisAngle( vy, parseFloat( data.shift().trim() ) * Math.PI / 180 );
					keyframe.rotation.multiply( quat );
					break;
				case 'Zrotation':
					quat.setFromAxisAngle( vz, parseFloat( data.shift().trim() ) * Math.PI / 180 );
					keyframe.rotation.multiply( quat );
					break;
				default:
					console.warn( 'THREE.BVHLoader: Invalid channel type.' );

			}

		}

		// parse child nodes

		for ( let i = 0; i < bone.children.length; i ++ ) {

			readFrameBoneData( data, frameTime, bone.children[ i ] );

		}

	}

	/*
		Recursively reads data from a single frame into the bone hierarchy.
		The passed bone hierarchy has to be structured in the same order as the BVH file.
		keyframe data is stored in bone.frames.

		- data: splitted string array (frame values), values are shift()ed so
		this should be empty after parsing the whole hierarchy.
		- frameTime: playback time for this keyframe.
		- bs: blendshapes array to read frame data from.
	*/
	function readFrameBSData( data, frameTime, bs ) {

		for( let i = 0; i < bs.length; i++ ) {
			// add keyframe
			if(!data.length) {
				return;
			}
			const keyframe = {
				time: frameTime,
				weight: 0
			};

			bs[i].frames.push( keyframe );
			// parse values in node
			keyframe.weight = parseFloat( data.shift().trim() );
		}		
	}

	/*
		Recursively parses the HIERACHY section of the BVH file

		- lines: all lines of the file. lines are consumed as we go along.
		- firstline: line containing the node type and name e.g. 'JOINT hip'
		- list: collects a flat list of nodes

		returns: a BVH node including children
	*/
	function readNode( lines, firstline, list ) {

		const node = { name: '', type: '', frames: [] };
		list.push( node );

		// parse node type and name

		let tokens = firstline.split( /[\s]+/ );

		if ( tokens[ 0 ].toUpperCase() === 'END' && tokens[ 1 ].toUpperCase() === 'SITE' ) {

			node.type = 'ENDSITE';
			node.name = 'ENDSITE'; // bvh end sites have no name

		} else {

			node.name = tokens[ 1 ];
			node.type = tokens[ 0 ].toUpperCase();

		}

		if ( nextLine( lines ) !== '{' ) {

			console.error( 'THREE.BVHLoader: Expected opening { after type & name' );

		}

		// parse OFFSET

		tokens = nextLine( lines ).split( /[\s]+/ );

		if ( tokens[ 0 ] !== 'OFFSET' ) {

			console.error( 'THREE.BVHLoader: Expected OFFSET but got: ' + tokens[ 0 ] );

		}

		if ( tokens.length !== 4 ) {

			console.error( 'THREE.BVHLoader: Invalid number of values for OFFSET.' );

		}

		const offset = new THREE.Vector3(
			parseFloat( tokens[ 1 ] ),
			parseFloat( tokens[ 2 ] ),
			parseFloat( tokens[ 3 ] )
		);

		if ( isNaN( offset.x ) || isNaN( offset.y ) || isNaN( offset.z ) ) {

			console.error( 'THREE.BVHLoader: Invalid values of OFFSET.' );

		}

		node.offset = offset;

		// parse CHANNELS definitions

		if ( node.type !== 'ENDSITE' ) {

			tokens = nextLine( lines ).split( /[\s]+/ );

			if ( tokens[ 0 ] !== 'CHANNELS' ) {

				console.error( 'THREE.BVHLoader: Expected CHANNELS definition.' );

			}

			const numChannels = parseInt( tokens[ 1 ] );
			node.channels = tokens.splice( 2, numChannels );
			node.children = [];

		}

		// read children

		while ( true ) {

			const line = nextLine( lines );

			if ( line === '}' ) {

				return node;

			} else {

				node.children.push( readNode( lines, line, list ) );

			}

		}

	}

	/*
		Recursively parses the BLENDSHAPES section of the BVH file

		- lines: all lines of the file. lines are consumed as we go along.
		- firstline: line containing the blendshape name e.g. 'Blink_Left' and the skinning meshes names that have this morph target
		- list: collects a flat list of blendshapes

		returns: a BVH node including children
	*/
	function readBlendshape( lines, line, list ) {

		while ( true ) {
			let line = nextLine( lines );

			if ( line === '{' ) continue;
			if ( line === '}' ) return list;

			let node = { name: '', meshes: [], frames: [] };
			list.push( node );

			// parse node type and name

			let tokens = line.split( /[\s]+/ );

			node.name = tokens[ 0 ];

			for(let i = 1; i < tokens.length; i++){

				node.meshes.push(tokens[ i ]);

			}
			

		}
		
	}

	/*
		recursively converts the internal bvh node structure to a Bone hierarchy

		source: the bvh root node
		list: pass an empty array, collects a flat list of all converted THREE.Bones

		returns the root Bone
	*/
	function toTHREEBone( source, list ) {

		const bone = new THREE.Bone();
		list.push( bone );

		bone.position.add( source.offset );
		bone.name = source.name;

		if ( source.type !== 'ENDSITE' ) {

			for ( let i = 0; i < source.children.length; i ++ ) {

				bone.add( toTHREEBone( source.children[ i ], list ) );

			}

		}

		return bone;

	}

	/*
		builds a AnimationClip from the keyframe data saved in each bone.

		bone: bvh root node

		returns: a AnimationClip containing position and quaternion tracks
	*/
	function toTHREEAnimation( bones, blendshapes ) {

		const boneTracks = [];

		// create a position and quaternion animation track for each node

		for ( let i = 0; i < bones.length; i ++ ) {

			const bone = bones[ i ];

			if ( bone.type === 'ENDSITE' )
				continue;

			// track data

			const times = [];
			const positions = [];
			const rotations = [];

			for ( let j = 0; j < bone.frames.length; j ++ ) {

				const frame = bone.frames[ j ];

				times.push( frame.time );

				// the animation system animates the position property,
				// so we have to add the joint offset to all values

				positions.push( frame.position.x + bone.offset.x );
				positions.push( frame.position.y + bone.offset.y );
				positions.push( frame.position.z + bone.offset.z );

				rotations.push( frame.rotation.x );
				rotations.push( frame.rotation.y );
				rotations.push( frame.rotation.z );
				rotations.push( frame.rotation.w );

			}

			if ( scope.animateBonePositions ) {

				boneTracks.push( new THREE.VectorKeyframeTrack( bone.name + '.position', times, positions ) );

			}

			if ( scope.animateBoneRotations ) {

				boneTracks.push( new THREE.QuaternionKeyframeTrack( bone.name + '.quaternion', times, rotations ) );

			}

		}

		const bsTracks = [];
		if(blendshapes) {
			for ( let i = 0; i < blendshapes.length; i ++ ) {
	
				const bs = blendshapes[ i ];
				// track data
	
				const times = [];
				const weights = [];
	
				for ( let j = 0; j < bs.frames.length; j ++ ) {
					const frame = bs.frames[ j ];
	
					times.push( frame.time );
	
					// the animation system animates the morphInfluences property,
					// so we have to add the blendhsape weight to all values
	
					weights.push( frame.weight );
				}
				
				if( bs.meshes.length ) {
	
					for( let b = 0; b < bs.meshes.length; b++) {
						
						bsTracks.push( new THREE.NumberKeyframeTrack( bs.meshes[b] + '.morphTargetInfluences[' + bs.name + ']', times, weights ) );
					}
				}
				else {
	
					bsTracks.push( new THREE.NumberKeyframeTrack( 'Body' + '.morphTargetInfluences[' + bs.name + ']', times, weights ) );
				}	
				
			}
		}
		return { skeletonClip: new THREE.AnimationClip( 'skeletonAnimation', - 1, boneTracks ), blendshapesClip: new THREE.AnimationClip( 'bsAnimation', - 1, bsTracks )};

	}

	/*
		returns the next non-empty line in lines
	*/
	function nextLine( lines ) {

		let line;
		// skip empty lines
		while ( ( line = lines.shift().trim() ).length === 0 ) { }

		return line;

	}

	const scope = this;

	const lines = text.split( /[\r\n]+/g );

	const {bones, blendshapes} = readBvh( lines );

	const threeBones = [];
	if(bones.length)
		toTHREEBone( bones[ 0 ], threeBones );

	const {skeletonClip, blendshapesClip } = toTHREEAnimation( bones, blendshapes );

	return {
		skeletonAnim: {
			skeleton: skeletonClip.tracks.length ? new THREE.Skeleton( threeBones ) : null,
			clip: skeletonClip
		},
		blendshapesAnim: {
			clip: blendshapesClip
		}
	};		
}

export { BVHLoader }