import * as THREE from 'three';
import arm from './modules/arm.js';
import { Application } from 'https://components.int-t.com/current/core/application/application.js';
import 'https://components.int-t.com/current/components/euler/euler.js';
import 'https://components.int-t.com/current/components/quaternion/quaternion.js';
import 'https://components.int-t.com/current/components/floatValue/floatValue.js';
import 'https://components.int-t.com/current/components/led/led.js';
import 'https://components.int-t.com/current/components/flexPanel/flexPanel.js';
import 'https://components.int-t.com/current/components/errorMessage/errorMessage.js';
import 'https://components.int-t.com/current/components/title/title.js';
import 'https://components.int-t.com/current/components/gridPanel/gridPanel.js';
import 'https://components.int-t.com/current/components/toggleButton/toggleButton.js';

arm.onupdate = armCallback;

let gComponents = null;
let gPlatform = null;
let gShoulder = null;
let gElbow = null;
let gWrist = null;
let gClaw = null;

function createCube(materials, position) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);  
  const cube = new THREE.Mesh(geometry, materials);
  cube.position.x = position.x;
  cube.position.y = position.y;
  cube.position.z = position.z;
  return cube;
}


function ready() {
  function animate() {
    requestAnimationFrame( animate );  
    if (gPlatform != null)
      platform.setRotationFromQuaternion(gPlatform);            
    if (gShoulder != null)
      shoulder.setRotationFromQuaternion(gShoulder);
    if (gElbow != null)
      elbow.setRotationFromQuaternion(gElbow);
    if (gWrist != null)
      wrist.setRotationFromQuaternion(gWrist);
    //if (gClaw != null)
    //  claw.setRotationFromQuaternion(gClaw);
    renderer.render( scene, camera );
  }
    
  const application = window.document.querySelector('.application');
  gComponents = application.components;
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
  //gComponents.grid.setRow(1, 'height', 'auto');
  
  const platform = createCube(materials, { x: 0, y: 0, z: 0 });
  const shoulder = createCube(materials, { x: 2, y: 0, z: 0 });  
  const elbow = createCube(materials, { x: 4, y: 0, z: 0 });
  const wrist = createCube(materials, { x: 6, y: 0, z: 0 });  
  const claw = createCube(materials, { x: 8, y: 0, z: 0 });
    
  scene.add(platform);
  scene.add(shoulder);
  scene.add(elbow);
  scene.add(wrist);
  scene.add(claw);

  camera.rotation.x = THREE.MathUtils.degToRad(-90);
  camera.position.x = 5;
  camera.position.y = 5;
  camera.position.z = 0;
  animate();
}

async function armCallback(status) {
  if (gComponents == null) return;
  
  gComponents.error.message = '';
  
  const poQuat = new THREE.Quaternion(status.platform.i, status.platform.j, status.platform.k, status.platform.real);
  const soQuat = new THREE.Quaternion(status.shoulder.i, status.shoulder.j, status.shoulder.k, status.shoulder.real);
  const eoQuat = new THREE.Quaternion(status.elbow.i, status.elbow.j, status.elbow.k, status.elbow.real);  
  const woQuat = new THREE.Quaternion(status.wrist.i, status.wrist.j, status.wrist.k, status.wrist.real);
  const coQuat = new THREE.Quaternion(status.claw.i, status.claw.j, status.claw.k, status.claw.real);
  
  //const snQuat = soQuat;
  //const pnQuat = poQuat;
  
  const dq = Math.sqrt(2) / 2;
  
  const pmQuat = new THREE.Quaternion(0, 0, 0, 1); //East-South-Down
  //const pmQuat = new THREE.Quaternion(0, -1, 0, 0); //East-South-Down
  const psQuat = gComponents.platform.rotate.quaternion;
  const prQuat = psQuat.multiplyQuaternions(pmQuat, psQuat);
      
  //const srQuat = new THREE.Quaternion(-0.5, -0.5, 0.5, -0.5); //Up-East-North

  const smQuat = new THREE.Quaternion(0, 0, 0, 1);    //East North Up
  //const srQuat = new THREE.Quaternion(0, 0, dq, dq); //North West Up 
  //const srQuat = new THREE.Quaternion(0, 0, 1, 0); //West South Up 
  //const srQuat = new THREE.Quaternion(0, 0, -dq, dq) //South East Up 
  //const smQuat = new THREE.Quaternion(0, -1, 0, 0) //East South Down 
  //const smQuat = new THREE.Quaternion(0.5, -0.5, -0.5, 0.5) //South Up West 
  const ssQuat = gComponents.shoulder.rotate.quaternion;
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
  pnQuat.normalize();
    
  gComponents.platform.quaternion.i = pnQuat.x;
  gComponents.platform.quaternion.j = pnQuat.y;
  gComponents.platform.quaternion.k = pnQuat.z;
  gComponents.platform.quaternion.real = pnQuat.w;
  gComponents.platform.accuracy.value = status.platform.quaternionAccuracy;
  
  const pEuler = new THREE.Euler().setFromQuaternion(pnQuat);
  gComponents.platform.euler.roll = (pEuler.x * (180 / Math.PI)).toFixed(3);
  gComponents.platform.euler.pitch = (pEuler.y * (180 / Math.PI)).toFixed(3);
  gComponents.platform.euler.yaw = (pEuler.z * (180 / Math.PI)).toFixed(3);

  gComponents.platform.online.value = status.arm.online;
  gComponents.platform.canSending.value = status.arm.canSendOK;
  gComponents.platform.engines.value = status.arm.enginesEnabled;
  gComponents.platform.camera.value = status.arm.cameraEnabled;

  const snQuat = soQuat.multiplyQuaternions(srQuat, soQuat);
  snQuat.normalize();
  
  gComponents.shoulder.quaternion.i = snQuat.x;
  gComponents.shoulder.quaternion.j = snQuat.y;
  gComponents.shoulder.quaternion.k = snQuat.z;
  gComponents.shoulder.quaternion.real = snQuat.w;
  gComponents.shoulder.accuracy.value = status.shoulder.quaternionAccuracy;
  gComponents.shoulder.online.value = status.arm.shoulderOK;
  
  //const sEuler = euler.get(snQuat.x,  snQuat.y, snQuat.z, snQuat.w);
  const sEuler = new THREE.Euler().setFromQuaternion(snQuat);
  gComponents.shoulder.euler.roll = sEuler.x * (180 / Math.PI);
  gComponents.shoulder.euler.pitch = sEuler.y * (180 / Math.PI);
  gComponents.shoulder.euler.yaw = sEuler.z * (180 / Math.PI);

  gComponents.elbow.quaternion.i = eoQuat.x;
  gComponents.elbow.quaternion.j = eoQuat.y;
  gComponents.elbow.quaternion.k = eoQuat.z;
  gComponents.elbow.quaternion.real = eoQuat.w;
  gComponents.elbow.accuracy.value = status.elbow.quaternionAccuracy;
  gComponents.elbow.online.value = status.arm.elbowOK;

  const eEuler = new THREE.Euler().setFromQuaternion(woQuat);
  gComponents.elbow.euler.roll = eEuler.x * (180 / Math.PI);
  gComponents.elbow.euler.pitch = eEuler.y * (180 / Math.PI);
  gComponents.elbow.euler.yaw = eEuler.z * (180 / Math.PI);

  gComponents.wrist.quaternion.i = woQuat.x;
  gComponents.wrist.quaternion.j = woQuat.y;
  gComponents.wrist.quaternion.k = woQuat.z;
  gComponents.wrist.quaternion.real = woQuat.w;
  gComponents.wrist.accuracy.value = status.wrist.quaternionAccuracy;
  gComponents.wrist.online.value = status.arm.wristOK;

  const wEuler = new THREE.Euler().setFromQuaternion(eoQuat);
  gComponents.wrist.euler.roll = wEuler.x * (180 / Math.PI);
  gComponents.wrist.euler.pitch = wEuler.y * (180 / Math.PI);
  gComponents.wrist.euler.yaw = wEuler.z * (180 / Math.PI);
  
  gComponents.claw.quaternion.i = coQuat.x;
  gComponents.claw.quaternion.j = coQuat.y;
  gComponents.claw.quaternion.k = coQuat.z;
  gComponents.claw.quaternion.real = coQuat.w;  
  gComponents.claw.online.value = status.arm.clawOK;

  const cEuler = new THREE.Euler().setFromQuaternion(coQuat);
  gComponents.claw.euler.roll = cEuler.x * (180 / Math.PI);
  gComponents.claw.euler.pitch = cEuler.y * (180 / Math.PI);
  gComponents.claw.euler.yaw = cEuler.z * (180 / Math.PI);

  gComponents.claw.distance.value = status.claw.distance;
  gComponents.claw.distanceType.value = status.claw.distanceType;
  gPlatform = pnQuat;
  gShoulder = snQuat;
  gElbow = eoQuat;
  gWrist = woQuat;
  gClaw = coQuat;  
}

export class IMUApplication extends Application { 
  componentReady() {
    ready();
  }

  toggleEngines(element) {
    console.log('engines', element.value);
  }

  toggleCamera(element) {
    console.log('camera', element.value);
  }
}

customElements.define('imu-application', IMUApplication);
