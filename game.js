var Game = Game || {};

Game.init = function () {

    this.resetGravity();

    this.scoreBoard = document.getElementById("scoreBoard");

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(90, 375 / 667, 0.1, 1000);

    this.addLights();

    this.camera.position.set(0, this.player.height, -6);
    this.camera.lookAt(new THREE.Vector3(0, -this.player.height, 0));

    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(375, 667);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    document.body.appendChild(this.renderer.domElement);

    this.addLoader();
    this.loadResources();
    update();
};

Game.resetGravity = function () {
    this.cy = 0;
    this.dt = 0.1;
    this.vy = 0;
    this.mvy = 1;
    this.gravity = 0.05;
    this.collision = false;
};

Game.addLights = function () {
    // LIGHTS
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    this.light = new THREE.PointLight(0xffffff, 1, 18);
    this.light.position.set(-3, 6, -3);
    this.light.castShadow = true;
    this.light.shadow.camera.near = 0.1;
    this.light.shadow.camera.far = 25;
    this.scene.add(this.light);
};

Game.resetGame = function () {

    ind = undefined;
    _cubeBox = undefined;
    boxVector = undefined;
    spherePos = undefined;
    xPoint = undefined;
    yPoint = undefined;
    zPoint = undefined;
    clearInd = 0;

    for (var i = this.scene.children.length - 1; i >= 0; i--) {
        this.scene.remove(this.scene.children[i]);
    }
    this.addLights();
    this.GAME_STARTED = false;

    this.resetGravity();

    this.cameraY = -0.5;
    this.gameOver = false;
    this.score = 0;

    this.colliderArr = [];
    this.platformArr = [];

    this.scoreBoard.innerHTML = "Score 0";
    this.camera.position.set(0, this.player.height, -6);
    this.camera.lookAt(new THREE.Vector3(0, -this.player.height, 0));
    this.loadResources();
};

Game.addLoader = function () {

    var progress = document.createElement('div');
    progress.setAttribute("id", "loader");
    var progressBar = document.createElement('div');
    progressBar.setAttribute("id", "bar");
    progress.appendChild(progressBar);
    document.body.appendChild(progress);

    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onProgress = function (item, loaded, total) {
        progressBar.style.width = (loaded / total * 100) + '%';
        console.log(item, loaded, total);
    };
    this.loadingManager.onLoad = function () {
        console.log("loaded all resources");
        !Game.GAME_LOADED && document.body.removeChild(progress);
        Game.GAME_LOADED = true;
        Game.GAME_STARTED = true;
        Game.onResourcesLoaded();
    };
};

Game.loadResources = function () {

    var models = {
        ball: {
            obj: "res/Ball.obj",
            mtl: "res/Ball.mtl",
            mesh: null
        }
    };
    var pie = {
        obj: "res/Pie.obj",
        mtl: null,
        mesh: null
    };

    var bgMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 1000, 5, 5),
        new THREE.MeshBasicMaterial({
            color: 0xABB2B9,
            wireframe: this.USE_WIREFRAME,
            side: THREE.DoubleSide
        })
    );

    bgMesh.rotation.x += Math.PI;
    bgMesh.receiveShadow = true;
    bgMesh.position.set(0, -1, 4);
    this.scene.add(bgMesh);

    this.cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 150, 50),
        new THREE.MeshPhongMaterial({wireframe: this.USE_WIREFRAME, color: 0xEDBB99})
    );
    this.cylinder.receiveShadow = true;
    this.cylinder.position.set(0, -75, 0);

    this.cylinderGroup = new THREE.Group();
    this.cylinderGroup.add(this.cylinder);
    this.scene.add(this.cylinderGroup);

    // LOADING MODELS
    for (var _key in models) {
        (function (key) {

            var mtlLoader = new THREE.MTLLoader(Game.loadingManager);
            mtlLoader.load(models[key].mtl, function (materials) {
                materials.preload();

                var objLoader = new THREE.OBJLoader(Game.loadingManager);

                objLoader.setMaterials(materials);
                objLoader.load(models[key].obj, function (mesh) {

                    mesh.scale.set(0.2, 0.2, 0.2);
                    mesh.traverse(function (node) {
                        if (node instanceof THREE.Mesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                            node.material.color.setHex(0xE74C3C);
                        }
                    });
                    Game.ball = mesh;
                });
            });

        })(_key);
    }


    var textureLoader = new THREE.TextureLoader(this.loadingManager);
    var pieTexture = textureLoader.load("res/pie.jpg");
    var objLoader = new THREE.OBJLoader(this.loadingManager);
    objLoader.load(pie.obj, function (mesh) {
        mesh.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                node.material.map = pieTexture;
                node.material.color.setHex(0x922B21);
            }
        });
        Game.redPlatform = mesh.clone();
    });

    var textureLoader2 = new THREE.TextureLoader(this.loadingManager);
    var pieTexture2 = textureLoader2.load("res/pie.jpg");
    var objLoader2 = new THREE.OBJLoader(this.loadingManager);
    objLoader2.load(pie.obj, function (mesh) {
        mesh.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                node.material.map = pieTexture2;
                node.material.color.setHex(0x5499C7);
            }
        });
        Game.yellowPlatform = mesh.clone();
    });
};

Game.onResourcesLoaded = function () {

    //ball = models.ball.mesh.clone();
    this.ball.scale.set(0.02, 0.02, 0.02);
    this.ball.position.set(0, 1, -2.25);
    this.scene.add(this.ball);

    this.sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 20, 20), this.materials.solid);
    this.sphere.position.set(this.ball.position.x, this.ball.position.y, this.ball.position.z);
    this.sphere.geometry.computeBoundingSphere();
    this.scene.add(this.sphere);
    this.sphere.visible = this.MESH_VISIBILTY;

    this.addPlatform();

    this.cy = this.ball.position.y;
    this.cylinderGroup.rotation.y -= 1;
};

Game.addPlatform = function () {

    this.colliderArr = [];
    this.platformArr = [];

    var yDiff = 2;
    var platformPieceType = [
        {type: this.GREEN_PIECE},
        {type: this.RED_PIECE}
    ];
    var rotationValue = 0.786;
    var plIndex = -1;

    var levelCount = 5;
    var collider = [];
    var platGroupArr = [];
    var colliderGroupArr = [];
    var platformPiece;

    var randomPlatform = [
        {
            count: 1,
            rotation: [1.3],
            type: [0]

        },
        {
            count: 5,
            rotation: [2.8, 4.8, 5.8, 7.8, 0.8],
            type: [1, 0, 0, 1, 0]
        },
        {
            count: 3,
            rotation: [7.2, 6.2, 3.6],
            type: [0, 0, 1]
        },
        {
            count: 2,
            rotation: [0.2, 2.2],
            type: [0, 1]
        },
        {
            count: 5,
            rotation: [0.9, 2.9, 3.9, 4.9, 6.9],
            type: [1, 0, 1, 0, 0]
        },
        {
            count: 5,
            rotation: [0, 1, 2.3, 4.1, 6],
            type: [1, 0, 1, 0, 1]
        }

    ];

    for (var a = 0; a < levelCount; a++) {
        ++plIndex;

        if (plIndex >= randomPlatform.length) {
            plIndex = 0;
        }

        var type = this.shuffle(randomPlatform[plIndex].type);

        platGroupArr = [];
        colliderGroupArr = [];

        for (var i = 0; i < randomPlatform[plIndex].count; i++) {
            if (platformPieceType[type[i]].type === this.RED_PIECE)
                platformPiece = this.redPlatform.clone();
            else
                platformPiece = this.yellowPlatform.clone();

            platformPiece.position.set(0, 0, 0);

            collider = [];

            collider.push(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.2), this.materials.solid));
            collider[0].position.set(-1.83, -0.22, 1.11);
            collider[0].rotation.x += Math.PI / 2;
            collider[0].rotation.z -= 0.78;
            collider[0].receiveShadow = true;
            collider[0].visible = this.MESH_VISIBILTY;
            collider[0].platformType = platformPieceType[type[i]].type;


            collider.push(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.2), this.materials.solid));
            collider[1].position.set(-2.15, -0.22, 0.51);
            collider[1].rotation.x += Math.PI / 2;
            collider[1].receiveShadow = true;
            collider[1].visible = this.MESH_VISIBILTY;
            collider[1].platformType = platformPieceType[type[i]].type;

            var platGroup = new THREE.Group();
            platGroup.add(platformPiece);
            platGroup.add(collider[0]);
            platGroup.add(collider[1]);
            platGroup.rotation.y -= randomPlatform[plIndex].rotation[i] * rotationValue;
            platGroup.position.y -= (a * yDiff);
            this.cylinderGroup.add(platGroup);

            platGroupArr.push(platGroup);

            colliderGroupArr.push(collider[0]);
            colliderGroupArr.push(collider[1]);

        }
        this.platformArr[a * 2] = platGroupArr;
        this.colliderArr[a * 2] = colliderGroupArr;
    }

};

Game.shuffle = function (array) {
    //return array;
    var m = array.length,
        t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
};


function update() {
    requestAnimationFrame(update);
    Game.updateKeyboard();
    Game.renderer.render(Game.scene, Game.camera);

    if (Game.GAME_STARTED) {
        if (!Game.gameOver) {
            if (Game.collision) { // ball is on surface
                Game.vy = -Game.vy;
                Game.collision = false;
            }
            Game.cy -= Game.vy * Game.dt;
            Game.ball.position.y = Game.cy;

            if (Game.vy <= Game.mvy)
                Game.vy += Game.gravity;

            Game.sphere.position.set(Game.ball.position.x, Game.ball.position.y, Game.ball.position.z);
            Game.updateCamera();
            Game.collision = Game.findCollision();
        }
    }
}

var ind, _cubeBox;
var boxVector;
var spherePos;
var xPoint;
var yPoint;
var zPoint;
var clearInd = 0;

Game.findCollision = function () {

    ind = Math.abs(Math.round(this.cy));

    if (clearInd < ind) {
        this.breakPlatforms(clearInd);
        clearInd = ind;
    }


    if (this.colliderArr[ind]) {
        boxVector = new THREE.Vector3();
        for (var i = 0; i < this.colliderArr[ind].length; i++) {
            _cubeBox = this.colliderArr[ind][i];
            boxVector.setFromMatrixPosition(_cubeBox.matrixWorld);
            spherePos = this.sphere.position.clone();

            xPoint = boxVector.x;
            yPoint = boxVector.y - spherePos.y;
            zPoint = boxVector.z;

            if (xPoint < 0.6 && xPoint > -0.55 && yPoint <= 2 && yPoint >= -0.2 && zPoint < -1.8 && zPoint > -2.4) {
                //console.log("x ", xPoint, "y ", yPoint, "z ", zPoint);
                if (_cubeBox.type === this.RED_PIECE) {
                    this.gameOver = true;
                    this.scoreBoard.innerHTML = "GAME OVER";
                    this.changeBallColor();
                    this.restart();
                }
                return true;
            }
        }
    }
    return false;
};

Game.restart = function () {
    var count = 2;
    var self = this;
    self.scoreBoard.innerHTML = "Game Restarting in " + (count + 1);

    var countDownId = setInterval(function () {
        if (count < 0) {
            clearInterval(countDownId);
            self.resetGame();
        } else {
            self.scoreBoard.innerHTML = "Game Restarting in " + count;
        }
        --count;

    }, 1000);
};

Game.breakPlatforms = function (clearInd) {
    clearInd = clearInd - 1;
    if (this.platformArr[clearInd]) {
        for (var i = 0; i < this.platformArr[clearInd].length; i++) {
            this.cylinderGroup.remove(this.platformArr[clearInd][i]);
        }
        this.platformArr[clearInd] = undefined;
        ++this.score;
        this.scoreBoard.innerHTML = "Score " + this.score;
    }
};

Game.updateCamera = function () {

    if (this.cameraY > this.ball.position.y)
        this.cameraY = this.ball.position.y;

    this.camera.position.set(0, this.cameraY + this.player.height, -6);
    this.camera.lookAt(new THREE.Vector3(0, this.cameraY - this.player.height, 0));
    this.light.position.set(-3, this.cameraY + this.player.height + 4, -3);
};

Game.changeBallColor = function () {

    this.ball.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material.color.setHex(0x2287E5);
        }
    });
};

var keyboard = {};
Game.updateKeyboard = function () {
    if (!this.gameOver) {
        if (keyboard[37]) { // left arrow key
            this.cylinderGroup.rotation.y -= this.player.rotateSpeed;
        }

        if (keyboard[39]) { // right arrow key
            this.cylinderGroup.rotation.y += this.player.rotateSpeed;
        }
    }
};

Game.player = {
    height: 2,
    speed: 0.1,
    turnSpeed: Math.PI * 0.02,
    rotateSpeed: Math.PI * 0.01
};
Game.MESH_VISIBILTY = false;
Game.USE_WIREFRAME = false;
Game.RED_PIECE = 10;
Game.GREEN_PIECE = 11;
Game.GAME_LOADED = false;
Game.GAME_STARTED = false;

Game.materials = {
    shadow: new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.5
    }),
    solid: new THREE.MeshNormalMaterial({}),
    colliding: new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
    }),
    dot: new THREE.MeshBasicMaterial({
        color: 0x0000ff
    })
};

Game.cameraY = -0.5;
Game.gameOver = false;
Game.score = 0;


window.addEventListener('keydown', function (event) {
    keyboard[event.keyCode] = true;
});

window.addEventListener('keyup', function (event) {
    keyboard[event.keyCode] = false;
});

window.onload = function () {
    Game.init();
};