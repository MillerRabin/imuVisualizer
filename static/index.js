import * as THREE from 'three';
import arm from './modules/arm.js';
import quaternion from './modules/quaternion.js';
import './components/euler/euler.js';

let gComponents = null;

arm.onupdate = armCallback;

const gPlatform = { roll: NaN, pitch: NaN, yaw: NaN };
const gShoulder = { roll: NaN, pitch: NaN, yaw: NaN };

window.document.addEventListener('DOMContentLoaded', ready);

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
  
  return {
    renderer: application.querySelector('.renderer'),
    status: {
      shoulderRotate: {
        euler: shoulder.querySelector('imu-euler')
      },
      shoulder: {
        i: shoulder.querySelector('.qi .value'),
        j: shoulder.querySelector('.qj .value'),
        k: shoulder.querySelector('.qk .value'),
        real: shoulder.querySelector('.qr .value'),
        roll: shoulder.querySelector('.roll .value'),
        pitch: shoulder.querySelector('.pitch .value'),
        yaw: shoulder.querySelector('.yaw .value'),
        accuracy: shoulder.querySelector('.acc .value'),
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
      error: status.querySelector('.error')
    }
  }
  
}

function ready() {
  function animate() {
    requestAnimationFrame( animate );  
    shoulder.rotation.x = gShoulder.pitch;
    shoulder.rotation.y = gShoulder.yaw;
    shoulder.rotation.z = gShoulder.roll;  
    platform.rotation.x = gPlatform.pitch;
    platform.rotation.y = gPlatform.yaw;
    platform.rotation.z = gPlatform.roll;    
    renderer.render( scene, camera );
  }
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);  
  const renderer = new THREE.WebGLRenderer();      
  
  gComponents = getComponents();
    
  renderer.setSize(gComponents.renderer.clientWidth, gComponents.renderer.clientHeight);

  gComponents.renderer.appendChild(renderer.domElement);
  const materials =  [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    new THREE.MeshBasicMaterial({ color: 0x0000ff }),
    new THREE.MeshBasicMaterial({ color: 0xff00ff }),
    new THREE.MeshBasicMaterial({ color: 0x00ffff }),
    new THREE.MeshBasicMaterial({ color: 0xaa00aa }),
  ];
  const shoulder = createCube(materials, { x: 0, y: 0, z: 0 });
  const platform = createCube(materials, { x: 2, y: 0, z: 0 });
  scene.add(shoulder);
  scene.add(platform);
  camera.position.z = 5;    
  animate();
}

async function armCallback(status) {
  if (gComponents == null) return;
  
  const sQuat = { 
    i: status.shoulder.i,
    j: status.shoulder.j,
    k: status.shoulder.k,
    real: status.shoulder.real
  };

  const rsVector = gComponents.status.shoulderRotate.euler.vector;  
  const rQuat = quaternion.multiplyVector(sQuat, rsVector);
  gComponents.status.shoulder.i.innerHTML = rQuat.i.toFixed(3);
  gComponents.status.shoulder.j.innerHTML = rQuat.j.toFixed(3);
  gComponents.status.shoulder.k.innerHTML = rQuat.k.toFixed(3);
  gComponents.status.shoulder.real.innerHTML = rQuat.real.toFixed(3);
    
  gComponents.status.shoulder.roll.innerHTML = THREE.MathUtils.radToDeg(status.shoulder.roll).toFixed(3);
  gComponents.status.shoulder.pitch.innerHTML = THREE.MathUtils.radToDeg(status.shoulder.pitch).toFixed(3);
  gComponents.status.shoulder.yaw.innerHTML = THREE.MathUtils.radToDeg(status.shoulder.yaw).toFixed(3);
  gComponents.status.shoulder.accuracy.innerHTML = status.shoulder.quaternionAccuracy;
  gComponents.status.platform.i.innerHTML = status.platform.i.toFixed(3);
  gComponents.status.platform.j.innerHTML = status.platform.j.toFixed(3);
  gComponents.status.platform.k.innerHTML = status.platform.k.toFixed(3);
  gComponents.status.platform.real.innerHTML = status.platform.real.toFixed(3);
  gComponents.status.platform.roll.innerHTML = THREE.MathUtils.radToDeg(status.platform.roll).toFixed(3);
  gComponents.status.platform.pitch.innerHTML = THREE.MathUtils.radToDeg(status.platform.pitch).toFixed(3);
  gComponents.status.platform.yaw.innerHTML = THREE.MathUtils.radToDeg(status.platform.yaw).toFixed(3);
  gComponents.status.platform.accuracy.innerHTML = status.platform.quaternionAccuracy;
  gShoulder.yaw = status.shoulder.yaw;
  gShoulder.roll = status.shoulder.roll;
  gShoulder.pitch = status.shoulder.pitch;
  gPlatform.yaw = status.platform.yaw;
  gPlatform.roll = status.platform.roll;
  gPlatform.pitch = status.platform.pitch;
}
