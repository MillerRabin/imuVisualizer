import * as THREE from 'three';
import arm from './modules/arm.js';
import 'https://components.int-t.com/vector/vector.js';
import 'https://components.int-t.com/euler/euler.js';
import 'https://components.int-t.com/quaternion/quaternion.js';
import 'https://components.int-t.com/floatValue/floatValue.js';
import 'https://components.int-t.com/led/led.js';
import 'https://components.int-t.com/flexPanel/flexPanel.js';
import './components/status/status.js';

let gComponents = null;

window.document.addEventListener('DOMContentLoaded', ready);

arm.onupdate = armCallback;

let gPlatform = null;
let gShoulder = null;

function createCube(materials, position) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);  
  const cube = new THREE.Mesh(geometry, materials);
  cube.position.x = position.x;
  cube.position.y = position.y;
  cube.position.z = position.z;
  return cube;
}

function getComponents() {
  const application = window.document.querySelector('.application');  
  const status = application.querySelector('.status');
  const shoulder = status.querySelector('.shoulder');
  const platform = status.querySelector('.platform');
  const claw = status.querySelector('.claw');
  const armStatus = application.querySelector('arm-status');
  return {
    renderer: application.querySelector('.renderer'),
    status: {
      shoulderRotate: {
        euler: shoulder.querySelector('intention-euler.rotate')
      },
      platformRotate: {
        euler: platform.querySelector('intention-euler.rotate')
      },
      shoulder: {
        armQuaternion: shoulder.querySelector('intention-quaternion'),
        roll: shoulder.querySelector('.roll .value'),
        pitch: shoulder.querySelector('.pitch .value'),
        yaw: shoulder.querySelector('.yaw .value'),
        accuracy: shoulder.querySelector('.shoulder-accuracy'),
        euler: shoulder.querySelector('.shoulder-euler'),
      },
      claw: {
        i: claw.querySelector('.qi .value'),
        j: claw.querySelector('.qj .value'),
        k: claw.querySelector('.qk .value'),
        real: claw.querySelector('.qr .value'),
        roll: claw.querySelector('.roll .value'),
        pitch: claw.querySelector('.pitch .value'),
        yaw: claw.querySelector('.yaw .value'),
        accuracy: claw.querySelector('.acc .value'),
        distance: claw.querySelector('.distance .value'),
        distanceType: claw.querySelector('.distance-type .value'),
      },
      platform: {
        i: platform.querySelector('.qi .value'),
        j: platform.querySelector('.qj .value'),
        k: platform.querySelector('.qk .value'),
        real: platform.querySelector('.qr .value'),
        roll: platform.querySelector('.roll .value'),
        pitch: platform.querySelector('.pitch .value'),
        yaw: platform.querySelector('.yaw .value'),
        accuracy: platform.querySelector('.acc .value'),
      },      
      error: status.querySelector('.error'),
      arm: armStatus
    }
  }
}

function ready() {
  function animate() {
    requestAnimationFrame( animate );  
    if (gShoulder != null)
      shoulder.setRotationFromQuaternion(gShoulder);
    if (gPlatform != null)
      platform.setRotationFromQuaternion(gPlatform);            
    renderer.render( scene, camera );
  }
    
  gComponents = getComponents();  
  const ratio = gComponents.renderer.clientWidth / gComponents.renderer.clientHeight;    

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000);  
  const renderer = new THREE.WebGLRenderer();      
  const loader = new THREE.TextureLoader();
  
  const image1 = loader.load('/images/1.png');
  const image2 = loader.load('/images/2.png');
  const image3 = loader.load('/images/3.png');
  const image4 = loader.load('/images/4.png');
  const image5 = loader.load('/images/5.png');
  const image6 = loader.load('/images/6.png');
  
  const materials = [
    new THREE.MeshBasicMaterial({ map: image1 }),
    new THREE.MeshBasicMaterial({ map: image2 }),
    new THREE.MeshBasicMaterial({ map: image3 }),
    new THREE.MeshBasicMaterial({ map: image4 }),
    new THREE.MeshBasicMaterial({ map: image5 }),
    new THREE.MeshBasicMaterial({ map: image6 })
  ];

  renderer.setSize(gComponents.renderer.clientWidth, gComponents.renderer.clientHeight);

  gComponents.renderer.appendChild(renderer.domElement);
  
  const shoulder = createCube(materials, { x: 0, y: 0, z: 0 });  
  const platform = createCube(materials, { x: 2, y: 0, z: 0 });
  scene.add(shoulder);
  scene.add(platform);
  camera.rotation.x = THREE.MathUtils.degToRad(-90);
  camera.position.x = 0;
  camera.position.y = 5;
  camera.position.z = 0;
  animate();
}

async function armCallback(status) {
  if (gComponents == null) return;
  
  const poQuat = new THREE.Quaternion(status.platform.i, status.platform.j, status.platform.k, status.platform.real);
  const soQuat = new THREE.Quaternion(status.shoulder.i, status.shoulder.j, status.shoulder.k, status.shoulder.real);
  
  //const snQuat = soQuat;
  //const pnQuat = poQuat;
  
  const dq = Math.sqrt(2) / 2;
  
  const pmQuat = new THREE.Quaternion(0, 0, 0, 1); //East-South-Down
  //const pmQuat = new THREE.Quaternion(0, -1, 0, 0); //East-South-Down
  const psQuat = gComponents.status.platformRotate.euler.quaternion;
  const prQuat = psQuat.multiplyQuaternions(pmQuat, psQuat);
      
  //const srQuat = new THREE.Quaternion(-0.5, -0.5, 0.5, -0.5); //Up-East-North

  const smQuat = new THREE.Quaternion(0, 0, 0, 1);    //East North Up
  //const srQuat = new THREE.Quaternion(0, 0, dq, dq); //North West Up 
  //const srQuat = new THREE.Quaternion(0, 0, 1, 0); //West South Up 
  //const srQuat = new THREE.Quaternion(0, 0, -dq, dq) //South East Up 
  //const smQuat = new THREE.Quaternion(0, -1, 0, 0) //East South Down 
  //const smQuat = new THREE.Quaternion(0.5, -0.5, -0.5, 0.5) //South Up West 
  const ssQuat = gComponents.status.shoulderRotate.euler.quaternion;
  const srQuat = ssQuat.multiplyQuaternions(smQuat, ssQuat);
      
  //const srQuat = new THREE.Quaternion(-dq, -dq, 0, 0) //North East Down 
  //const srQuat = new THREE.Quaternion(-1, 0, 0, 0) //West North Down 
  //const srQuat = new THREE.Quaternion(-dq, dq, 0, 0) //South West Down 
  //const srQuat = new THREE.Quaternion(0, -dq, dq, 0) //Up South East 
  //const srQuat = new THREE.Quaternion(-0.5, -0.5, 0.5, 0.5) //North Up East 
  //const srQuat = new THREE.Quaternion(-dq, 0, 0, dq) //Down North East 
  //const srQuat = new THREE.Quaternion(-0.5, 0.5, -0.5, 0.5) //South Down East 
  //const srQuat = new THREE.Quaternion(-dq, 0, 0, -dq) //Up North West 
  //const srQuat = new THREE.Quaternion(-0.5, -0.5, -0.5, -0.5) //North Down West 
  //const srQuat = new THREE.Quaternion(0, -dq, -dq, 0) //Down South West 
  //const srQuat = new THREE.Quaternion(0.5, -0.5, -0.5, 0.5) //South Up West 
  //const srQuat = new THREE.Quaternion(-0.5, -0.5, 0.5, -0.5); //Up East North 
  //const srQuat = new THREE.Quaternion(-dq, 0, dq, 0) //West Up North 
  //const srQuat = new THREE.Quaternion(-0.5, 0.5, 0.5, 0.5) //Down West North 
  //const srQuat = new THREE.Quaternion(0, -dq, 0, -dq) //East Down North 
  //const srQuat = new THREE.Quaternion(0.5, -0.5, 0.5, 0.5) //Up West South 
  //const srQuat = new THREE.Quaternion(-dq, 0, -dq, 0) //West Down South 
  //const srQuat = new THREE.Quaternion(-0.5, -0.5, -0.5, 0.5) //Down East South 
  //const srQuat = new THREE.Quaternion(0, -dq, 0, dq) //East Up South 
  
  const pnQuat = poQuat.multiplyQuaternions(prQuat, poQuat);
  //pnQuat.normalize();
  //const snQuat = soQuat.multiplyQuaternions(srQuat, soQuat);
  
  const snQuat = soQuat.multiplyQuaternions(srQuat, soQuat);
  
  //snQuat.normalize();
  gComponents.status.shoulder.armQuaternion.i = snQuat.x;
  gComponents.status.shoulder.armQuaternion.j = snQuat.y;
  gComponents.status.shoulder.armQuaternion.k = snQuat.z;
  gComponents.status.shoulder.armQuaternion.real = snQuat.w;
    
  gComponents.status.shoulder.accuracy.value = status.shoulder.quaternionAccuracy;
  gComponents.status.platform.i.innerHTML = pnQuat.x.toFixed(3);
  gComponents.status.platform.j.innerHTML = pnQuat.y.toFixed(3);
  gComponents.status.platform.k.innerHTML = pnQuat.z.toFixed(3);
  gComponents.status.platform.real.innerHTML = pnQuat.w.toFixed(3);
  gComponents.status.platform.accuracy.innerHTML = status.platform.quaternionAccuracy;

  //const sEuler = euler.get(snQuat.x,  snQuat.y, snQuat.z, snQuat.w);
  const sEuler = new THREE.Euler().setFromQuaternion(snQuat);
  const pEuler = new THREE.Euler().setFromQuaternion(pnQuat);
    
  gComponents.status.shoulder.roll.innerHTML = `${sEuler.x.toFixed(3)} / ${THREE.MathUtils.radToDeg(sEuler.x).toFixed(3)}`;
  gComponents.status.shoulder.pitch.innerHTML = `${sEuler.y.toFixed(3)} / ${THREE.MathUtils.radToDeg(sEuler.y).toFixed(3)}`;
  gComponents.status.shoulder.yaw.innerHTML = `${sEuler.z.toFixed(3)} / ${THREE.MathUtils.radToDeg(sEuler.z).toFixed(3)}`;
  gComponents.status.platform.roll.innerHTML = `${pEuler.x.toFixed(3)} / ${THREE.MathUtils.radToDeg(pEuler.x).toFixed(3)}`;
  gComponents.status.platform.pitch.innerHTML = `${pEuler.y.toFixed(3)} / ${THREE.MathUtils.radToDeg(pEuler.y).toFixed(3)}`;
  gComponents.status.platform.yaw.innerHTML = `${pEuler.z.toFixed(3)} / ${THREE.MathUtils.radToDeg(pEuler.z).toFixed(3)}`;

  gComponents.status.claw.distance.innerHTML = status.claw.distance;
  gComponents.status.claw.distanceType.innerHTML = status.claw.distanceType;

  gComponents.status.arm.setStatus(status.arm);
  gShoulder = snQuat;
  gPlatform = pnQuat;
}
