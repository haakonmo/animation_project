if (!Detector.webgl)
	Detector.addGetWebGLMessage();

var camera, controls, scene, renderer;

var mesh, smokeParticles, smoke;

var PARTICLE_COUNT = 10000;
var PARTICLE_SIZE = 50;
init();
animate();

function init() {

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
	var particleCount = smokeParticles.vertices.length;
	while (particleCount--) {
		var particle = smokeParticles.vertices[particleCount];
		particle.y += Math.random() * 7;
		particle.x += Math.random() * 10 - 5;
		particle.z += Math.random() * 10 - 5;

		if (particle.y >= window.innerHeight) {
			particle.y = 0;
			particle.x = 0;
			particle.z = 0;
		}
	}
	smokeParticles.__dirtyVertices = true;
}

function render() {
	renderer.render(scene, camera);
}