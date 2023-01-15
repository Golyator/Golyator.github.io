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
const far = 10000;

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

const sun = new THREE.Mesh(geometry, material);
sun.position.set(0, 0, 0);
sun.layers.set(1);
scene.add(sun);


//planet
let planets = [];
const Planet = class extends THREE.Object3D {
  constructor(speed, perihelion, aphelion, radius, detail, distance, color, texture, scene, rotation, time) {
    super();
    this.speed = speed;
    this.perihelion = perihelion;
    this.aphelion = aphelion;
    this.distance = distance;
    this.time = time;
    this.geometry = new THREE.IcosahedronGeometry(radius, detail);
    this.material = new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture("texture/" + texture),
      side: THREE.BackSide,
      transparent: false,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.layers.set(1);
    this.mesh.rotation.x = rotation * Math.PI / 180;
    scene.add(this.mesh);
    return this;
  }
  gravitate() {
    let distance = THREE.Math.lerp(this.perihelion, this.aphelion, Math.sin((Date.now()/this.time) * (2 * Math.PI)));
    this.mesh.position.x = distance * Math.cos((Date.now()/this.time) * (2 * Math.PI));
    this.mesh.position.z = distance * Math.sin((Date.now()/this.time) * (2 * Math.PI));
    this.mesh.rotation.y += this.speed;
  }
}
const mars = new Planet(0.01, 2492, 2067, 4, 50, 100, "#FDB813", 'mars2.jpg', scene, 0, 62000);
planets.push(mars);

const earth = new Planet(0.01, 1471, 1521, 6, 50, 150, "#FDB813", 'earth2.jpg', scene, 23.5, 30000);
planets.push(earth);

// galaxy geometry
const starGeometry = new THREE.SphereGeometry(4020, 164, 164);

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

//animation loop
const animate = () => {
  requestAnimationFrame(animate);
  starMesh.rotation.y += 0.0003;
  sun.rotation.y += 0.001;
  for (let planet of planets) {
    planet.gravitate();
  }
  renderer.render(scene, camera);
  camera.layers.set(1);
  bloomComposer.render();
};

function onDocumentMouseWheel( event ) {
  const zoomMax = 4580;
  const zoomMin = 500;
  console.log(camera.position.z)
  camera.position.z = Math.min(Math.max(zoomMin,  camera.position.z - event.wheelDeltaY * 0.5), zoomMax);
}
dcoument.addEventListener('gestureend', function(event) {
  const zoomMax = 280;
  const zoomMin = 15;
  console.log(camera.position.z)
  camera.position.z = Math.min(Math.max(zoomMin,  camera.position.z - event.scale * 0.05), zoomMax);
}, false);


document.addEventListener( 'wheel', onDocumentMouseWheel, false );
animate();
