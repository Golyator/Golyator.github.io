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
const near = 100;
const far = 14000;

//camera
camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.x = 0;
camera.position.z = 0;
camera.position.y = 1850;
camera.rotation.x = -90 * Math.PI / 180;
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
bloomPass.strength = 1; //intensity of glow
bloomPass.radius = 0.1;
const bloomComposer = new EffectComposer(renderer);
bloomComposer.setSize(window.innerWidth, window.innerHeight);
bloomComposer.renderToScreen = true;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

//sun object
const color = new THREE.Color("#FDB813");
const geometry = new THREE.IcosahedronGeometry(1027, 50);
const material = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load("texture/sun.jpg"),
  side: THREE.BackSide,
  transparent: true,
});

const sun = new THREE.Mesh(geometry, material);
sun.position.set(0, 0, 0);
sun.layers.set(1);
scene.add(sun);


//planet
let planets = [];
const Planet = class extends THREE.Object3D {
  constructor(rotationspeed, perihelion, aphelion, radius, detail, distance, color, texture, scene, rotation, time) {
    super();
    this.rotationspeed = rotationspeed;
    this.perihelion = perihelion;
    this.aphelion = aphelion;
    this.distance = distance;
    this.time = time;
    this.geometry = new THREE.IcosahedronGeometry(radius, detail);
    this.material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('texture/'+texture),
      side: THREE.BackSide,
      transparent: false,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.layers.set(1);
    this.mesh.rotation.x = rotation * Math.PI / 180;

    this.ringGeometry = new THREE.TorusGeometry(radius + 0.2, 0.1, 16, 100);
    this.ringMaterial = new THREE.MeshBasicMaterial({
       color: 0xffffff,
       transparent: true,
       opacity: 0.5
    });
    this.ring = new THREE.Mesh(this.ringGeometry, this.ringMaterial);
    this.ring.position.set(0, 0, 0);
    this.ring.rotation.x = Math.PI / 2;
    this.add(this.ring);
    
    scene.add(this.mesh);
    return this;
  }

  gravitate() {
    let distance = THREE.Math.lerp(this.perihelion, this.aphelion, Math.sin((Date.now()/this.time) * (2 * Math.PI)));
    this.mesh.position.x = distance * Math.cos((Date.now()/this.time) * (2 * Math.PI));
    this.mesh.position.z = distance * Math.sin((Date.now()/this.time) * (2 * Math.PI));
    this.mesh.rotation.y += this.rotationspeed;
  }
}
const mars = new Planet(0.01, 2492, 2067, 40, 50, 100, "#FDB813", 'mars2.png', scene, 25, 62000);
planets.push(mars);

const earth = new Planet(0.01, 1471, 1521, 60, 50, 150, "#FDB813", 'earth2.jpg', scene, 23.5, 30000);
planets.push(earth);

const jupiter = new Planet(0.01, 3780, 3170, 150, 50, 150, "#FDB813", 'jupiter.png', scene, 3.13, 300000);
planets.push(jupiter);


// galaxy geometry
const starGeometry = new THREE.SphereGeometry(4020, 164, 164);

// galaxy material
const starMaterial = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load("texture/galaxy1.png"),
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

//set clock
let clock = new THREE.Clock();
let delta = 0;
// 30 fps
let interval = 1 / 30;

//animation loop
const animate = () => {
  requestAnimationFrame(animate);
  //fps cap
  delta += clock.getDelta();
  if (delta  > interval) {
      starMesh.rotation.y += 0.0003;
      sun.rotation.y += 0.001;
      for (let planet of planets) {
        planet.gravitate();
      }
      renderer.render(scene, camera);
      camera.layers.set(1);
      bloomComposer.render();
  }
};

//controls
function onDocumentMouseWheel( event ) {
  const zoomMax = 8580;
  const zoomMin = 500;
  camera.position.y = Math.min(Math.max(zoomMin,  camera.position.y - event.wheelDeltaY * 0.5), zoomMax);
}
document.addEventListener( 'wheel', onDocumentMouseWheel, false );

let touchStartY;
let touchMoveY;

// Add event listener for touchstart event
document.addEventListener("touchstart", function(event) {
  touchStartY = event.touches[0].clientY;
}, false);

// Add event listener for touchmove event
document.addEventListener("touchmove", function(event) {
  touchMoveY = event.touches[0].clientY;
  const zoomMax = 8580;
  const zoomMin = 500;
  let deltaY = touchStartY - touchMoveY;
  camera.position.y = Math.min(Math.max(zoomMin,  camera.position.y - deltaY * 0.5), zoomMax);
}, false);

animate();
