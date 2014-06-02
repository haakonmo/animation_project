if (!Detector.webgl)
	Detector.addGetWebGLMessage()

var fluid

var camera, controls, scene, renderer

var mesh, smokeParticles, smoke

var PARTICLE_COUNT = 10000
var PARTICLE_SIZE  = 1
init()
animate()

function init() {

	// renderer
	renderer = new THREE.WebGLRenderer({
		antialias : false
	})

	renderer.shadowMapEnabled  = true
	renderer.shadowMapCullFace = THREE.CullFaceBack

	renderer.setClearColor(0x8088e0, 1)
	renderer.setSize(512, 512)

	// fluid
	fluid = new CS274C.Fluid()

	// camera
	var element = renderer.domElement
	var aspect  = element.width / element.height
	camera = new THREE.PerspectiveCamera(30, aspect, 0.01, 1000)
	camera.position.set(-15, -50, 25)
	camera.up.set(0, 0, 1)
	controls = new THREE.OrbitControls(camera)
	controls.target = new THREE.Vector3(0, 0, 7)
	controls.addEventListener('change', render)

	// scene
	scene = new THREE.Scene()

	// lights
	lightHemi = new THREE.HemisphereLight(0x8080FF, 0x804040, 0.2)
	lightHemi.position.set(0, 500, 0)
	scene.add(lightHemi)

	var lightDirection = new THREE.DirectionalLight(0xF0F0F0, 1)
	lightDirection.position.set(10, 10, 100)
	lightDirection.castShadow         = true
	lightDirection.shadowMapWidth     = 2048
	lightDirection.shadowMapHeight    = 2048
	lightDirection.shadowCameraLeft   = -100
	lightDirection.shadowCameraRight  =  100
	lightDirection.shadowCameraTop    =  100
	lightDirection.shadowCameraBottom = -100
	lightDirection.shadowCameraFar    =  3500
	lightDirection.shadowBias         = -0.0001
	lightDirection.shadowDarkness     =  0.35
	scene.add(lightDirection)

	// ground
	var groundGeometry = new THREE.PlaneGeometry(25, 25)
	var groundMaterial = new THREE.MeshPhongMaterial(
			{color: 0x3B2E29, side: THREE.DoubleSide})
	var ground         = new THREE.Mesh(groundGeometry, groundMaterial)
	ground.receiveShadow = true
	scene.add(ground)

	// sphere (for light testing)
	var sphereGeometry = new THREE.SphereGeometry(5, 32, 32)
	var sphereMaterial = new THREE.MeshPhongMaterial({color:0xffffff})
	var sphere         = new THREE.Mesh(sphereGeometry, sphereMaterial)
	sphere.position.set(-5, 5, 2)
	sphere.castShadow = true
	scene.add(sphere)

	// smoke
	smokeParticles = new THREE.Geometry
	for (var i = 0; i < PARTICLE_COUNT; i++) {
		var particle = new THREE.Vector3(0, 0, 0)
		smokeParticles.vertices.push(particle)
	}

	var smokeMaterial = new THREE.ParticleBasicMaterial({
		// map: THREE.ImageUtils.loadTexture('../images/particle.png'),
		transparent: true,
		blending:    THREE.AdditiveBlending,
		size:        PARTICLE_SIZE,
		color:       0x111111
	})

	smoke = new THREE.ParticleSystem(smokeParticles, smokeMaterial)
	smoke.sortParticles = true
	smoke.castShadow    = true
	smoke.receiveShadow = true
	scene.add(smoke)

	// append
	document.body.appendChild(renderer.domElement)
	//window.addEventListener('resize', onWindowResize, false)

}

function onWindowResize() {

	windowHalfX = window.innerWidth  / 2
	windowHalfY = window.innerHeight / 2

	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()

	renderer.setSize(window.innerWidth, window.innerHeight)

}

//

function animate() {
	requestAnimationFrame(animate)
	controls.update()
	animateSmoke()
	render()
}

function animateSmoke() {
	var points = smokeParticles.vertices

	fluid.step()
	fluid.move(points)

	for (var i = 0; i < points.length; i++) {
		if (points[i].y >= window.innerHeight) {
			//points[i].x = 0
			points[i].y = 0
			points[i].z = 0
		}
	}
}

function render() {
	renderer.render(scene, camera)
}
