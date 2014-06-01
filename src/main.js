if (!Detector.webgl)
	Detector.addGetWebGLMessage();

var fluid;

var camera, controls, scene, renderer;

var mesh, smokeParticles, smoke;

var PARTICLE_COUNT = 10000;
var PARTICLE_SIZE = 50;
init();
animate();

function init() {

	// fluid
	fluid = new CS274C.Fluid();

	// camera
	camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 3500);
	camera.position.z = 2750;
	controls = new THREE.OrbitControls(camera);
	controls.addEventListener('change', render);

	// scene
	scene = new THREE.Scene();

	// smoke
	smokeParticles = new THREE.Geometry;
	for (var i = 0; i < PARTICLE_COUNT; i++) {
		var particle = new THREE.Vector3(0, 0, 0);
		smokeParticles.vertices.push(particle);
	}

	var smokeMaterial = new THREE.ParticleBasicMaterial({
		// map: THREE.ImageUtils.loadTexture('../images/particle.png'),
		transparent : true,
		blending : THREE.AdditiveBlending,
		size : PARTICLE_SIZE,
		color : 0x111111
	});

	smoke = new THREE.ParticleSystem(smokeParticles, smokeMaterial);
	smoke.sortParticles = true;
	scene.add(smoke);

	renderer = new THREE.WebGLRenderer({
		antialias : false
	});
	renderer.setClearColor(0x000000, 1);
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	animateSmoke();
	render();
}

function animateSmoke() {
	var points = smokeParticles.vertices;

	fluid.step();
	fluid.move(points);

	for (var i = 0; i < points.length; i++) {
		if (points[i].y >= window.innerHeight) {
			//points[i].x = 0;
			points[i].y = 0;
			points[i].z = 0;
		}
	}
}

function render() {
	renderer.render(scene, camera);
}
