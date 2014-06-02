if (!Detector.webgl)
	Detector.addGetWebGLMessage();

var fluid;

var camera, controls, scene, renderer, groundPlane;
var source = new THREE.Vector3(0, 0, 0);

var mesh, smokeParticles;

var PARTICLE_COUNT = 3000;
var PARTICLE_SIZE = 500;
var PARTICLE_OPACITY = 0.02;

init();
animate();

function init() {
	// fluid
	fluid = new CS274C.Fluid();

	// camera
	camera = new THREE.PerspectiveCamera(27, window.innerWidth / window.innerHeight, 5, 3500);
	camera.position.z = 1600;
	camera.position.y = 1500;
	controls = new THREE.OrbitControls(camera);
	controls.addEventListener('change', render);

	// scene
	scene = new THREE.Scene();

	// TODO: shader?

	// environment

	// surrounding sky
	var skyGeometry = new THREE.SphereGeometry(1200, 50, 40);
	var skyMaterial = new THREE.MeshBasicMaterial({
		map : THREE.ImageUtils.loadTexture('../images/sky.png'),
	});

	var skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
	skyBox.scale.set(-1, 1, 1);
	skyBox.eulerOrder = 'XZY';
	skyBox.renderDepth = 1000.0;
	scene.add(skyBox);

	// ground
	var groundGeometry = new THREE.PlaneGeometry(2000, 2000);
	var planeMeterial = new THREE.MeshBasicMaterial({
		map : THREE.ImageUtils.loadTexture('../images/ground.jpg'),
	});

	groundPlane = new THREE.Mesh(groundGeometry, planeMeterial);
	groundPlane.rotation.x = -90 * Math.PI / 180  ;
	scene.add(groundPlane);

	// smoke
	smokeParticles = new THREE.Geometry;
	for (var i = 0; i < PARTICLE_COUNT; i++) {
		var particle = new THREE.Vector3(source.x, source.y, source.z);
		smokeParticles.vertices.push(particle);
	}

	var smokeMaterial = new THREE.ParticleBasicMaterial({
		map : THREE.ImageUtils.loadTexture('../images/smoke.png'),
		transparent : true,
		opacity: PARTICLE_OPACITY,
		blending : THREE.NormalBlending,
		depthTest : true,
		size : PARTICLE_SIZE,
	});

	var smoke = new THREE.ParticleSystem(smokeParticles, smokeMaterial);
	smoke.sortParticles = true;
	scene.add(smoke);

	// lights
	// TODO:

	renderer = new THREE.WebGLRenderer({
		antialias : false
	});
	renderer.setClearColor(0x00ff00, 1);
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

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	animateSmoke();
	render();
	fluid.step();
}

function animateSmoke() {
	var points = smokeParticles.vertices;

	fluid.move(points);

	for (var i = 0; i < points.length; i++) {
		if (points[i].y >= window.innerHeight) {
			points[i].y = 0;
			points[i].x = source.x;
			points[i].z = source.z;
		}
	}
}

function render() {
	renderer.render(scene, camera);
}
