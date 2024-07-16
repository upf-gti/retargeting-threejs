# retargeting-threejs
 
Animation and pose retargeting solver for 3D humanoid characters with Threejs.

[[Try demo](https://webglstudio.org/demos/retargeting-threejs/)]

# Set up
The retargeting.js expects an importmap for three. Include the following lines in your index.html
``` html
<script async src="https://ga.jspm.io/npm:es-module-shims@1.10.0/dist/es-module-shims.js"></script>
<script type="importmap">
    {
            "imports": {
                "three": "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js"
            }
    }
</script>
```
# API

``` javascript
// example offline retarget

let source = loadSourceSkeleton(); // user function: returns THREE.Skeleton
let sourceAnim = loadSourceAnimation(); // user function: returns THREE.AnimationClip

let target = loadSkinnedModel(); // user function: returns some skinned model from a glb (for example)

let options = {
    srcPoseMode: AnimationRetargeting.BindPoseModes.DEFAULT, // will use the actual skeleton's bind pose
    trgPoseMode: AnimationRetargeting.BindPoseModes.CURRENT, // will use the current local transforms of the bones as bind pose
    trgEmbedWorldTransforms: true // the rotations of the parent(s) of the skeleton will be included in the retargeting. They are needed to make the source and target skeletons match, for this example.
}
let retargeting = new AnimationRetargeting( source, target, options );
retargeting.retargetAnimation( sourceAnim );

```


##  Constructor

Retargets animations and/or current poses from one skeleton to another. 
Both skeletons must have the same bind pose (same orientation for each mapped bone) in order to properly work.
Use optional parameters to adjust the bind pose.

```
AnimationRetargeting( srcSkeleton, trgSkeleton, options )
```
- `srcSkeleton` THREE.Skeleton <br> Skeleton of the source avatar. If not an skeleton, an object traverse will be perfomed to find one (from a skinnedMesh for example).
- `trgSkeleton` THREE.Skeleton <br> Same as srcSkeleton but for the target avatar
- `options` Object <br> optional attribute to modify the retargeting behaviour
    
    - `srcPoseMode` and `trgPoseMode`: AnimationRetargeting.BindPoseModes <br> Pose of the srcSkeleton that will be used as the bind pose for the retargeting. Default: skeleton's actual bind pose.

    - `srcEmbedWorldTransforms` and `trgEmbedWorldTransforms`: Bool <br> Retargeting only takes into account the  transforms from the actual bone objects (local transforms). If set to true, external (parent) transforms are computed and embedded into the root joint (only once, on construction). 
Afterwards, parent transforms/matrices can be safely modified and will not affect in retargeting.
Useful when it is easier to modify the container of the skeleton rather than the actual skeleton in order to align source and target poses.
    - `boneNameMap`: Object. <br> String-to-string mapping between src (keys) and trg (values) through bone names. Only supports one-to-one mapping. If no mapping is specified, an automatic one is performed based on the name of the bones.

  

## Static Properties

### BindPoseModes
Enumeration that determines which pose will be used as the retargeting bind pose.

- `DEFAULT` or `0`: Uses skeleton's actual bind pose
- `CURRENT` or `1`: Uses skeleton's current pose
- `TPOSE` or `2`: Forces the skeleton's current pose to T-pose and uses skeleton's current pose


## Methods 

### retargetPose
Retargets the current pose from the source skeleton to the target skeleton. Only the mapped bones are computed.

``` javascript
.retargetPose() : undefined
```

### retargetAnimation
Retargets a THREEJS AnimationClip from source to target skeleton. Returns another AnimationClip.
Only mapped bones are computed

```
.retargetAnimation( anim ) : THREE.AnimationClip
```
- `anim`: THREE.AnimationClip <br> animation to retarget


# Usual issues

A failed retargeting might be due to many reasons.

The lack of movement might be caused by an improper bone mapping or bad track IDs.

Weird target rotations might also be due to improper bone mapping. However, most commonly, it will be caused by incorrect set up of the auxiliary pose. The API exposes some attributes to alleviate this


### Case A: Successful Retargeting
<div style="display:flex; flex-wrap: wrap; width='100%' ">
    <image src="GoodPose.png" alt="Good skeleton bind pose" width="50%"></image>
    <image src="GoodRetarget.png" alt="Good skeleton bind pose" width="50%"></image> 
</div>

Case A shows a successful retargeting from the avatar on the left (red shirt) to the avatar on the right(white shirt). Note the white avatar only moves one finger as the source avatar only has one finger. It could have been manually mapped instead of relying on the automap.

### Case B: Current pose modification

<div style="display:flex; flex-wrap: wrap; width='100%' ">
    <image src="BadCurrentPose.png" alt="Bad skeleton bind Pose that requires modifying a joint" width="50%"></image>
    <image src="BadCurrentPoseRetarget.png" alt="Bad skeleton bind Pose that requires modifying a joint" width="50%"></image> 
</div>

Case B shows an example where both skeleton's auxiliary pose are different. In this particular case, only the root joint (hips) differs. Since the world rotations of the source avatar do not mean the same for the target avatar, the resulting animation look weird. For this case, it would suffice to rotate 90º the root joint and instantiating the AnimationRetargeting class with the `trgPoseMode` set to `CURRENT`, so it checks for the current modified target bone setup.

### Case C: World transform embeding

<div style="display:flex; flex-wrap: wrap; width='100%' ">
    <image src="BadEmbedPose.png" width="50%" alt="Bad skeleton's bind pose that requires modifying the container's transform"></image>
    <image src="BadEmbedRetarget.png" width="50%" alt="Bad skeleton's bind pose that requires modifying the container's transform"></image>
</div>


Case C shows a similar example as in case B. However, for this case it might be easier to just modify the container of the skeleton (or some upper container). Rotating the skeleton's parent object 90º results in the same pose as Case A. Then it would only suffice to instantiate AnimationRetargeting with `trgEmbedWorldTransforms` set to ```true```, so the algorithm takes the container's rotation into account