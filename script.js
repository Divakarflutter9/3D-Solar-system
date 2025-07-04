// Main variables
let scene, camera, renderer, controls;
let planets = [];
let clock = new THREE.Clock();
let isPaused = false;
let darkMode = true;
let stars = [];

// Planet data
const planetData = [
    { name: "Sun", radius: 5, distance: 0, color: 0xffff00, speed: 0, rotationSpeed: 0.01 },
    { name: "Mercury", radius: 0.4, distance: 7, color: 0xb5b5b5, speed: 0.04, rotationSpeed: 0.004 },
    { name: "Venus", radius: 0.9, distance: 9.5, color: 0xe6c229, speed: 0.015, rotationSpeed: 0.002 },
    { name: "Earth", radius: 1, distance: 13, color: 0x3498db, speed: 0.01, rotationSpeed: 0.02 },
    { name: "Mars", radius: 0.5, distance: 16, color: 0xe67e22, speed: 0.008, rotationSpeed: 0.018 },
    { name: "Jupiter", radius: 2, distance: 22, color: 0xf1c40f, speed: 0.003, speed: 0.003, rotationSpeed: 0.04 },
    { name: "Saturn", radius: 1.7, distance: 28, color: 0xf39c12, speed: 0.001, rotationSpeed: 0.038, hasRing: true },
    { name: "Uranus", radius: 1.3, distance: 34, color: 0x1abc9c, speed: 0.0007, rotationSpeed: 0.03 },
    { name: "Neptune", radius: 1.2, distance: 40, color: 0x3498db, speed: 0.0005, rotationSpeed: 0.032 }
];

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 50);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Add stars
    createStars();
    
    // Create planets
    createPlanets();
    
    // Create controls UI
    createControlsUI();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('reset-btn').addEventListener('click', resetScene);
    
    // Start animation loop
    animate();
}

// Create stars for background
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
    });
    
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starsMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starsMesh);
}

// Create planets and their orbits
function createPlanets() {
    planetData.forEach((planet, index) => {
        // Create planet geometry and material
        const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: planet.color,
            specular: 0x111111,
            shininess: 30
        });
        
        const planetMesh = new THREE.Mesh(geometry, material);
        
        // Position the planet
        if (planet.distance > 0) {
            planetMesh.position.x = planet.distance;
        }
        
        // Add to scene and planets array
        scene.add(planetMesh);
        
        // Create orbit path (optional visual)
        if (planet.distance > 0) {
            const orbitGeometry = new THREE.BufferGeometry();
            const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
            
            const points = [];
            const segments = 64;
            for (let i = 0; i <= segments; i++) {
                const theta = (i / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    planet.distance * Math.cos(theta),
                    0,
                    planet.distance * Math.sin(theta)
                ));
            }
            
            orbitGeometry.setFromPoints(points);
            const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
            scene.add(orbitLine);
        }
        
        // Add planet to array with additional properties
        planets.push({
            mesh: planetMesh,
            name: planet.name,
            speed: planet.speed,
            originalSpeed: planet.speed,
            distance: planet.distance,
            rotationSpeed: planet.rotationSpeed,
            angle: Math.random() * Math.PI * 2 // Random starting position
        });
        
        // Add rings for Saturn
        if (planet.hasRing) {
            const ringGeometry = new THREE.RingGeometry(planet.radius * 1.5, planet.radius * 2, 32);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                side: THREE.DoubleSide
            });
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = Math.PI / 2;
            planetMesh.add(ringMesh);
        }
    });
    
    // Add event listeners for planet hover
    planets.forEach(planet => {
        planet.mesh.userData = { name: planet.name, speed: planet.speed, distance: planet.distance };
        
        planet.mesh.addEventListener('mouseover', () => {
            document.getElementById('planet-info').style.display = 'block';
            document.getElementById('info-name').textContent = planet.name;
            document.getElementById('info-speed').textContent = (planet.speed / planet.originalSpeed).toFixed(1);
            document.getElementById('info-distance').textContent = planet.distance;
        });
        
        planet.mesh.addEventListener('mouseout', () => {
            document.getElementById('planet-info').style.display = 'none';
        });
    });
}

// Create speed control UI
function createControlsUI() {
    const controlsContainer = document.getElementById('controls');
    
    // Clear existing controls (except Sun)
    while (controlsContainer.children.length > 1) {
        controlsContainer.removeChild(controlsContainer.lastChild);
    }
    
    // Add controls for each planet (except Sun)
    planets.slice(1).forEach((planet, index) => {
        const controlGroup = document.createElement('div');
        controlGroup.className = 'control-group';
        
        const label = document.createElement('label');
        label.textContent = planet.name + ':';
        label.htmlFor = planet.name.toLowerCase() + '-speed';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = planet.name.toLowerCase() + '-speed';
        slider.min = '0';
        slider.max = '5';
        slider.step = '0.1';
        slider.value = '1';
        
        const speedValue = document.createElement('span');
        speedValue.className = 'speed-value';
        speedValue.textContent = '1x';
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            speedValue.textContent = value.toFixed(1) + 'x';
            planet.speed = planet.originalSpeed * value;
        });
        
        controlGroup.appendChild(label);
        controlGroup.appendChild(slider);
        controlGroup.appendChild(speedValue);
        controlsContainer.appendChild(controlGroup);
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (!isPaused) {
        // Update planet positions and rotations
        planets.forEach((planet, index) => {
            if (index > 0) { // Skip the Sun
                planet.angle += planet.speed * delta;
                planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
                planet.mesh.position.z = planet.distance * Math.sin(planet.angle);
            }
            
            // Rotate planet on its axis
            planet.mesh.rotation.y += planet.rotationSpeed * delta;
        });
    }
    
    // Update controls
    controls.update();
    
    // Render scene
    renderer.render(scene, camera);
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Toggle pause/resume
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
}

// Toggle dark/light theme
function toggleTheme() {
    darkMode = !darkMode;
    
    if (darkMode) {
        document.body.style.backgroundColor = '#000';
        document.getElementById('theme-btn').textContent = 'Light Mode';
    } else {
        document.body.style.backgroundColor = '#f0f0f0';
        document.getElementById('theme-btn').textContent = 'Dark Mode';
    }
}

// Reset scene to initial state
function resetScene() {
    planets.forEach((planet, index) => {
        if (index > 0) {
            planet.angle = Math.random() * Math.PI * 2;
            planet.speed = planet.originalSpeed;
            
            // Reset slider values
            const slider = document.getElementById(planet.name.toLowerCase() + '-speed');
            if (slider) {
                slider.value = '1';
                slider.dispatchEvent(new Event('input'));
            }
        }
    });
    
    // Reset camera
    camera.position.set(0, 30, 50);
    controls.reset();
}

// Initialize the app
init();