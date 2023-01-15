import * as THREE from "./modules/three/build/three.module.js";
import { EffectComposer } from "./modules/three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "./modules/three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./modules/three/examples/jsm/postprocessing/UnrealBloomPass.js";

//global declaration
let scene;
let camera;
let renderer;
const canvas = document.getElementById("webgl");
scene = new THREE.Scene();
const fov = 50;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 2000;

//camera
camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 8;
camera.position.x = 0;
camera.position.z = 850;
scene.add(camera);

//default renderer
renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
renderer.setClearColor(0x000000, 0.0);

//bloom renderer
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.1,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 1.4; //intensity of glow
bloomPass.radius = 0.1;
const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

//sun object
const color = new THREE.Color("#FDB813");
const geometry = new THREE.IcosahedronGeometry(327, 50);
const material = new THREE.MeshBasicMaterial({
  map: THREE.ImageUtils.loadTexture("texture/sun.jpg"),
  side: THREE.BackSide,
  transparent: true,
});

const sphere = new THREE.Mesh(geometry, material);
sphere.position.set(0, 0, 0);
sphere.layers.set(1);
scene.add(sphere);


//planet
const planetColor = new THREE.Color("#FDB813");
const planetGeometry = new THREE.IcosahedronGeometry(3, 50);
const planetMaterial = new THREE.MeshBasicMaterial({
  map: THREE.ImageUtils.loadTexture("texture/earth2.jpg"),
  side: THREE.BackSide,
  transparent: true,
});

const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0);
planet.layers.set(1);
planet.rotation.x =  23.5 * Math.PI/180;
scene.add(planet);

// galaxy geometry
const starGeometry = new THREE.SphereGeometry(2020, 164, 164);

// galaxy material
const starMaterial = new THREE.MeshBasicMaterial({
  map: THREE.ImageUtils.loadTexture("texture/galaxy1.png"),
  side: THREE.BackSide,
  transparent: true,
});

// galaxy mesh
const starMesh = new THREE.Mesh(starGeometry, starMaterial);
starMesh.layers.set(1);
scene.add(starMesh);


//ambient light
const ambientlight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientlight);



//resize listner
window.addEventListener(
  "resize",
  () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);




const perihelion = 930;
const aphelion = 1000;
const orbit = {
  radius: 50,
  speed: 0.01
};

//animation loop
const animate = () => {
  requestAnimationFrame(animate);
  starMesh.rotation.x += 0.0003;
  starMesh.rotation.y += 0.0003;
  sphere.rotation.y += 0.001;
  sphere.rotation.x += 0.001;
  const distance = THREE.Math.lerp(perihelion, aphelion, Math.sin((Date.now()/30000) * (2 * Math.PI)));
  planet.position.x = distance * Math.cos((Date.now()/30000) * (2 * Math.PI));
  planet.position.z = distance * Math.sin((Date.now()/30000) * (2 * Math.PI));
  planet.rotation.y += orbit.speed;
  renderer.render(scene, camera);

  camera.layers.set(1);
  bloomComposer.render();
};

function onDocumentMouseWheel( event ) {
  const zoomMax = 1680;
  const zoomMin = 500;
  console.log(camera.position.z)
  camera.position.z = Math.min(Math.max(zoomMin,  camera.position.z - event.wheelDeltaY * 0.05), zoomMax);
}
document.addEventListener( 'wheel', onDocumentMouseWheel, false );
animate();
