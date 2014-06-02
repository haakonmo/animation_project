if (!Detector.webgl)
	Detector.addGetWebGLMessage()

var element
var projector
var lastTime
var mouse, lastMove
var button = {}

var fires, fluid, velocityField

var camera, controls, scene, renderer

var smokeParticles

var GROUND_SIZE     = 25

//var GRID_SIZE        = [7, 7, 7]
//var GRID_SIZE        = [11, 11, 11]
//var GRID_SIZE        = [19, 19, 19]
//var GRID_SIZE        = [35, 35, 35]

var GRID_SCALE       = [GROUND_SIZE / (GRID_SIZE[0]-3),
                        GROUND_SIZE / (GRID_SIZE[1]-3),
                        GROUND_SIZE / (GRID_SIZE[2]-3)]
var GRID_OFFSET      = [-(GRID_SIZE[0]/2-0.5) * GRID_SCALE[0],
                        -(GRID_SIZE[1]/2-0.5) * GRID_SCALE[1],
                        -(               1.0) * GRID_SCALE[2]]
                     
var VECTOR_INDEX     = Math.floor(GRID_SIZE[1] / 2)
var VECTOR_MODULO    = 1
var VECTOR_OFFSET    = GRID_SIZE[1] / 2 - 0.5
                     
var BURN_RATE        = 200    // needs a residual

var PARTICLE_COUNT   = 10000
var PARTICLE_SIZE    = 10
var PARTICLE_OPACITY = 0.02

init()
animate()

function init() {

	// Default fire locations
	fires = [ {x: 0, y: 0, z: 0.5, heat: 1} ]

	// renderer
	renderer = new THREE.WebGLRenderer({
		antialias : false
	})

	renderer.shadowMapEnabled  = true
	renderer.shadowMapCullFace = THREE.CullFaceBack

	//renderer.setClearColor(0x8088e0, 1)
	renderer.setClearColor(0x00ff00, 1)

	element = renderer.domElement

	// fluid
	fluid = new CS274C.Fluid(GRID_SIZE, GRID_SCALE, GRID_OFFSET)
	//fluid.step(0.1)
	//fluid.step(0.1)
	//fluid.step(0.1)
	//fluid.step(0.1)

	// camera
	var aspect  = element.width / element.height
	camera = new THREE.PerspectiveCamera(30, aspect, 0.01, 1000)
	camera.position.set(-15, -50, 20)
	//camera.position.set(0, -50, 2)
	camera.up.set(0, 0, 1)
	controls = new THREE.OrbitControls(camera)
	controls.target = new THREE.Vector3(0, 0, 7)
	controls.addEventListener('change', render)

	projector = new THREE.Projector()

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

	// sky
	var skyGeometry = new THREE.SphereGeometry(50, 50, 40)
	var skyMaterial = new THREE.MeshBasicMaterial({
		map: THREE.ImageUtils.loadTexture('../images/sky.png'),
	})

	var sky = new THREE.Mesh(skyGeometry, skyMaterial)
	sky.rotation.x = Math.PI/2
	sky.rotation.y = 0
	sky.rotation.z = -Math.PI/2
	sky.scale.set(-1, 1, 1)
	sky.eulerOrder = 'ZXY'
	sky.renderDepth = 100.0
	scene.add(sky)

	// ground
	var groundGeometry = new THREE.PlaneGeometry(GROUND_SIZE*2, GROUND_SIZE*2)
	var groundMaterial = new THREE.MeshBasicMaterial({
		map : THREE.ImageUtils.loadTexture('../images/ground.jpg'),
	})
	var ground         = new THREE.Mesh(groundGeometry, groundMaterial)
	ground.receiveShadow = true
	scene.add(ground)

	// sphere (for light testing)
	var sphereGeometry = new THREE.SphereGeometry(5, 32, 32)
	var sphereMaterial = new THREE.MeshPhongMaterial({color:0xffffff})
	var sphere         = new THREE.Mesh(sphereGeometry, sphereMaterial)
	sphere.position.set(-5, 5, 2)
	sphere.castShadow = true
	//scene.add(sphere)

	// smoke
	smokeParticles = new THREE.Geometry
	for (var i = 0; i < PARTICLE_COUNT; i++) {
		var particle = new THREE.Vector3(0, 0, -1)
		smokeParticles.vertices.push(particle)
	}

	var smokeMaterial = new THREE.ParticleBasicMaterial({
		map:         THREE.ImageUtils.loadTexture('../images/smoke.png'),
		transparent: true,
		opacity:     PARTICLE_OPACITY,
		blending:    THREE.NormalBlending,
		depthTest:   true,
		size:        PARTICLE_SIZE,
	})

	var smoke = new THREE.ParticleSystem(smokeParticles, smokeMaterial)
	smoke.sortParticles = true
	smoke.castShadow    = true
	smoke.receiveShadow = true
	scene.add(smoke)

	// velocity field
	velocityField = []
	for (var x = 0; x < GRID_SIZE[0]; x++)
	for (var y = 0; y < GRID_SIZE[1]; y++)
	for (var z = 0; z < GRID_SIZE[2]; z++) {
		if ((y != VECTOR_INDEX) ||
		    (x % VECTOR_MODULO) ||
		    (y % VECTOR_MODULO) ||
		    (z % VECTOR_MODULO))
			continue
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
	document.addEventListener('mousemove', onMouseMove, false)
	document.addEventListener('keypress',  onKeyPress,  false)
	window.addEventListener('resize', onWindowResize, false)
	onWindowResize()

}

function onMouseMove(event) {
	event.preventDefault()
	var x =  (((event.clientX - element.offsetLeft + document.body.scrollLeft) / element.offsetWidth ) * 2 - 1)
	var y = -(((event.clientY - element.offsetTop  + document.body.scrollTop)  / element.offsetHeight) * 2 - 1)
	//console.log('move-xy='+[x,y])
	mouse  = {x:x, y:y}
	button.x = x
	button.y = y
}

function onKeyPress(event) {
	if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
		return
	event.preventDefault()
	button.key = event.key
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

	// Split pionts into visible and hidden points
	var visible = [], hidden = []
	for (var i = 0; i < points.length; i++) {
		if (points[i].z >= -0.5)
			visible.push(points[i])
		else
			hidden.push(points[i])
	}

	// Add new points
	for (var f = 0; f < fires.length; f++) {
		var fire = fires[f]
		for (var i = 0; i < BURN_RATE * dt; i++) {
			if (hidden.length > 0) {
				var point = hidden.pop()
				point.x = fire.x + (Math.random()-0.5) * 0.5
				point.y = fire.y + (Math.random()-0.5) * 0.5
				point.z = fire.z + (Math.random())     * 0.5
				visible.push(point)
			}
		}
		fluid.addForce(fire.x, fire.y, fire.z,
				[0, 0, fire.heat * dt])
	}

	// Process mouse events
	if (mouse) {
		//var normal    = new THREE.Vector3(0,-1,0)
		//var normal    = new THREE.Vector3(0,-1,0)
		var normal    = camera.position.clone().normalize()
		var plane     = new THREE.Plane(normal, 0)
		var vector    = new THREE.Vector3(mouse.x, mouse.y, 1)
		var raycaster = projector.pickingRay(vector, camera)
		var position  = raycaster.ray.intersectPlane(plane)

		if (lastMove) {
			var delta = position.clone().sub(lastMove)
			fluid.addForce(position.x, position.y, position.z,
					[delta.x, delta.y, delta.z])
			//alert('dx,dz='+delta.x+','+delta.z)
		}

		lastMove = position
		mouse    = false
	}
	if (button && button.key) {
		switch (button.key) {
			case 'e': // extinguish
				this.fires = []
				break

			case 'c': // clear
				var points = smokeParticles.vertices
				for (var i = 0; i < points.length; i++)
					points[i].z = -1
				break

			case 's': // stop
				var vel = fluid.getVelocity()
				for (var x = 0; x < GRID_SIZE[0]; x++)
				for (var y = 0; y < GRID_SIZE[1]; y++)
				for (var z = 0; z < GRID_SIZE[2]; z++)
					vel[x][y][z] = [0,0,0]
				break

			case 'f': // fire
				var normal    = new THREE.Vector3(0, 0, 1)
				var plane     = new THREE.Plane(normal, 0)
				var vector    = new THREE.Vector3(button.x, button.y, 1)
				var raycaster = projector.pickingRay(vector, camera)
				var position  = raycaster.ray.intersectPlane(plane)
				//alert('xy='+[button.x, button.y])
				//alert('pos: ' + [position.x, position.y, position.z])
				if (Math.abs(position.x) < GROUND_SIZE/2 &&
				    Math.abs(position.y) < GROUND_SIZE/2)
					fires.push({
						x: position.x,
						y: position.y,
						z: 0.5,
						heat: 1
					})
				break
		}
		button.key = false
	}

	// Move the visible points
	fluid.step(dt)
	fluid.move(dt, visible)

	// Update velocity field
	var vel = fluid.getVelocity()
	var idx = 0
	for (var x = 0; x < GRID_SIZE[0]; x++)
	for (var y = 0; y < GRID_SIZE[1]; y++)
	for (var z = 0; z < GRID_SIZE[2]; z++) {
		if ((y != VECTOR_INDEX) ||
		    (x % VECTOR_MODULO) ||
		    (y % VECTOR_MODULO) ||
		    (z % VECTOR_MODULO))
			continue
		var arr = velocityField[idx++]
		var vec = vel[x][y][z]
		arr.dst.set(arr.src.x + vec[0],
		            arr.src.y + vec[1],
		            arr.src.z + vec[2])
		var mag = arr.src.clone().sub(arr.dst).length()
		if (mag < 0.1)
			arr.dst.set(arr.src.x + 0,
				    arr.src.y + 0,
				    arr.src.z + 0.1)
		arr.line.geometry.verticesNeedUpdate = true
	}

	// Remove old objects
	for (var i = 0; i < visible.length; i++) {
		if (Math.abs(visible[i].x) >= GROUND_SIZE/2 ||
		    Math.abs(visible[i].y) >= GROUND_SIZE/2 ||
		    visible[i].z >= GROUND_SIZE)
			visible[i].z = -1
	}
}

function render() {
	renderer.render(scene, camera)
}
