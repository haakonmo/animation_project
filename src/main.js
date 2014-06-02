if (!Detector.webgl)
	Detector.addGetWebGLMessage()

var lastTime = 0

var fluid, velocityField

var camera, controls, scene, renderer

var smokeParticles, smoke

var GROUND_SIZE    = 16

//var GRID_SIZE      = [66, 66, 66]
var GRID_SIZE      = [34, 34, 34]
//var GRID_SIZE      = [18, 18, 18]
//var GRID_SIZE      = [10, 10, 10]
var GRID_SCALE     = [GROUND_SIZE / (GRID_SIZE[0]-2),
                      GROUND_SIZE / (GRID_SIZE[1]-2),
                      GROUND_SIZE / (GRID_SIZE[2]-2)]
var GRID_OFFSET    = [-(GRID_SIZE[0]/2-0.5) * GRID_SCALE[0],
                      -(GRID_SIZE[1]/2-0.5) * GRID_SCALE[1],
                      -(               1.0) * GRID_SCALE[1]]

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
	fluid = new CS274C.Fluid(GRID_SIZE, GRID_SCALE, GRID_OFFSET)
	//fluid.step(0.1)
	//fluid.step(0.1)
	//fluid.step(0.1)
	//fluid.step(0.1)

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
	var groundGeometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE)
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
		var particle = new THREE.Vector3(0, 0, -1)
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

	// velocity field
	velocityField = []
	for (var x = 0; x < GRID_SIZE[0]; x++)
	for (var z = 0; z < GRID_SIZE[2]; z++) {
		var y = 3.5

		var src = new THREE.Vector3(
				x * GRID_SCALE[0] + GRID_OFFSET[0],
				y * GRID_SCALE[1] + GRID_OFFSET[1],
				z * GRID_SCALE[2] + GRID_OFFSET[2])
		var dst = src.clone().add(new THREE.Vector3(0, 0, 1))

		var lineGeometry = new THREE.Geometry()
		lineGeometry.vertices.push(src)
		lineGeometry.vertices.push(dst)
		var lineMaterial = new THREE.LineBasicMaterial(
				{color:     0xff0000,
				 linewidth: 3})
		var line = new THREE.Line(lineGeometry, lineMaterial)
		line.dynamic = true
		scene.add(line)

		velocityField.push({
			src:  src,
			dst:  dst,
			line: line
		})
	}

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

function animate(timestamp) {
	var dt
	if (!lastTime || !timestamp)
		dt = 0
	else
		dt = (timestamp - lastTime) / 1000
	lastTime = timestamp
	if (dt > 0.1)
		dt = 0.1

	requestAnimationFrame(animate)
	controls.update()
	animateSmoke(dt)
	render()
}

function animateSmoke(dt) {
	var points  = smokeParticles.vertices
	var sorted  = points.sort(function(a, b){a.z - b.z})

	// Default fire locations
	var fires = [
		{x: 0, y: 0, z: 0},
		{x: 5, y: 0, z: 0},
		{x: 0, y:-5, z: 0},
	]

	// Split pionts into visible and hidden points
	var visible = [], hidden = [];
	for (var i = 0; i < points.length; i++) {
		if (points[i].z >= -0.5)
			visible.push(points[i])
		else
			hidden.push(points[i])
	}

	// Add new points
	for (var f = 0; f < fires.length; f++) {
		for (var i = 0; i < 100 * dt; i++) {
			if (hidden.length > 0) {
				var point = hidden.pop()
				point.x = fires[f].x + (Math.random()-0.5) * 0.5
				point.y = fires[f].y + (Math.random()-0.5) * 0.5
				point.z = fires[f].z + (Math.random())     * 2
				visible.push(point)
			}
		}

	}

	// Move the visible points
	fluid.step(dt)
	fluid.move(dt, visible)

	// Update velocity field
	var vel = fluid.getVelocity()
	var idx = 0
	for (var x = 0; x < GRID_SIZE[0]; x++)
	for (var z = 0; z < GRID_SIZE[2]; z++) {
		var arr = velocityField[idx++]
		var vec = vel[x][z]
		arr.dst.set(arr.src.x + vec[0],
		            arr.src.y + 0,
		            arr.src.z + vec[1])
		var mag = arr.src.clone().sub(arr.dst).length()
		if (mag < 0.1)
			arr.dst.set(arr.src.x + 0,
				    arr.src.y + 0,
				    arr.src.z + 0.1)
		arr.line.geometry.verticesNeedUpdate = true
	}

	// Remove old objects
	for (var i = 0; i < visible.length; i++)
		if (visible[i].z >= GROUND_SIZE)
			visible[i].z = -1
}

function render() {
	renderer.render(scene, camera)
}
