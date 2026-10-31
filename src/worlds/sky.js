import * as THREE from 'three';

// 🕊️ 하늘을 나는 고양이 (구름 천공섬 / Flying Cat Sky Realm)
// - 솜사탕 구름과 둥둥 떠 있는 천공섬, 무지개 아치 다리, 날개 달린 냥이, 떠오르는 열기구
export class SkyWorld {
  constructor(scene) {
    this.scene = scene;
    this.id = 'sky';
    this.name = '하늘을 나는 고양이';
    this.icon = '🕊️';
    this.desc = '솜사탕 구름과 무지개 다리를 건너 천사 날개 냥이들과 함께 하늘을 날아다니는 세상';
    this.background = 0x7dd3fc; // 청명하고 화사한 하늘색

    // 하늘의 탁 트인 공중 부유감을 담는 원근 카메라
    this.cameraConfig = {
      type: 'perspective',
      fov: 50,
      offset: [0, 7.5, 13.5],
      lookOffset: [0, 0.8, -0.8],
    };

    this.group = new THREE.Group();
    this.colliders = [];
    this.spawnPoint = [0, 0]; // 메인 천공섬 잔디밭

    this.waypoints = [
      [0, 0], [4, 2], [-4, 2], [0, 4.5], [0, -4.5],
      [7.5, 0], // 무지개 다리 위!
      [12.0, 0], // 동쪽 작은 구름섬 위!
      [-6, -4], [6, -4]
    ];

    this.animatedObjects = {
      wingedCats: [],
      hotAirBalloon: null,
      clouds: [],
      stars: [],
      rainbowMesh: null,
    };

    this._build();
  }

  _build() {
    this._buildSkyLighting();
    this._buildFloatingMainIsland();
    this._buildRainbowBridge();
    this._buildSubCloudIslands();
    this._buildFlyingWingedCats();
    this._buildHotAirBalloon();
    this._buildFluffyClouds();
    this._buildGoldenStars();
    this._initColliders();
  }

  _buildSkyLighting() {
    // 화사한 천공 앰비언트 (하늘 푸른빛 & 따뜻한 햇살)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x38bdf8, 1.25);
    hemiLight.position.set(0, 50, 0);
    this.group.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(20, 35, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.group.add(sunLight);
  }

  // 1. 공중에 둥둥 떠 있는 메인 잔디 천공섬 (Floating Main Island)
  _buildFloatingMainIsland() {
    const island = new THREE.Group();
    island.position.set(0, 0, 0);

    // 상단 파릇파릇 잔디 지표면
    const topGeo = new THREE.CylinderGeometry(8.5, 9.2, 0.8, 32);
    const topMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 }); // 화사한 봄 잔디 녹색
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = -0.4;
    topMesh.receiveShadow = true;
    island.add(topMesh);

    // 하단 흙과 둥근 바위 덩어리 (천공섬의 아래쪽 역원뿔)
    const baseGeo = new THREE.ConeGeometry(9.0, 7.5, 16);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = Math.PI; // 아래로 뾰족한 역원뿔
    baseMesh.position.y = -4.5;
    island.add(baseMesh);

    // 천공섬 가장자리에 뭉게뭉게 피어난 푹신한 구름 안전 펜스 (낙하 방지 구름 난간)
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      // 동쪽 무지개 다리 입구(ang in [-0.28, 0.28])는 다리로 건너갈 수 있게 열어둠
      if (Math.abs(ang) < 0.3) continue;

      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.3, 1), cloudMat);
      puff.position.set(Math.cos(ang) * 8.4, 0.25, Math.sin(ang) * 8.4);
      puff.castShadow = true;
      island.add(puff);
    }

    this.group.add(island);
    this.mainIsland = island;
  }

  // 2. 무지개 아치 다리 (Rainbow Bridge: 메인섬 -> 동쪽 서브 구름섬)
  _buildRainbowBridge() {
    const rainbowColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6, 0x6366f1, 0xa855f7];
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(8.5, 0, 0); // x: 6 ~ 11 구간

    rainbowColors.forEach((color, idx) => {
      // 7가지 색상의 얇은 아치형 리본 스트립
      const ribbonGeo = new THREE.PlaneGeometry(5.2, 0.22, 16, 1);
      // 버텍스에 부드러운 아치 곡선 부여
      const pos = ribbonGeo.attributes.position;
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v);
        const normX = x / 2.6; // -1.0 ~ 1.0
        const archY = Math.cos(normX * Math.PI * 0.48) * 0.95;
        pos.setY(v, pos.getY(v) + archY);
      }
      ribbonGeo.computeVertexNormals();

      const ribbonMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.rotation.x = -Math.PI / 2;
      ribbon.position.set(0, 0.05 + idx * 0.002, (idx - 3) * 0.24);
      bridgeGroup.add(ribbon);
    });

    this.group.add(bridgeGroup);
    this.animatedObjects.rainbowMesh = bridgeGroup;
  }

  // 3. 동쪽 서브 구름섬 (작은 공중 섬)
  _buildSubCloudIslands() {
    const subIsland = new THREE.Group();
    subIsland.position.set(13.5, 0.4, 0);

    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const subGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.6, 20);
    const subMesh = new THREE.Mesh(subGeo, new THREE.MeshLambertMaterial({ color: 0x86efac }));
    subMesh.position.y = -0.3;
    subMesh.receiveShadow = true;
    subIsland.add(subMesh);

    // 구름 테두리
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), cloudMat);
      puff.position.set(Math.cos(ang) * 3.6, -0.2, Math.sin(ang) * 3.6);
      subIsland.add(puff);
    }

    // 아기자기한 천공 벤치
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.6), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    bench.position.set(0, 0.15, 0);
    bench.castShadow = true;
    subIsland.add(bench);

    this.group.add(subIsland);
    this.subIsland = subIsland;
  }

  // 4. 날개를 펄럭이며 상공을 나는 천사 고양이들 (Flying Angel Cats)
  _buildFlyingWingedCats() {
    for (let i = 0; i < 3; i++) {
      const catGroup = new THREE.Group();

      // 아기 고양이 몸통 (치즈/삼색/턱시도)
      const bodyMat = new THREE.MeshLambertMaterial({
        color: i === 0 ? 0xf59e0b : (i === 1 ? 0xf8fafc : 0x1e293b),
      });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.45, 6, 8), bodyMat);
      body.rotation.x = Math.PI / 2;
      catGroup.add(body);

      // 머리 & 귀
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), bodyMat);
      head.position.set(0, 0.15, 0.32);
      catGroup.add(head);

      const earGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
      const earL = new THREE.Mesh(earGeo, bodyMat);
      earL.position.set(-0.1, 0.32, 0.32);
      catGroup.add(earL);

      const earR = earL.clone();
      earR.position.x = 0.1;
      catGroup.add(earR);

      // 천사 하얀 깃털 날개 (좌/우)
      const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const wingGeo = new THREE.PlaneGeometry(0.65, 0.32);

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-0.35, 0.2, 0);
      catGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(0.35, 0.2, 0);
      catGroup.add(rightWing);

      // 머리 위 반짝이는 엔젤 링 (Halo)
      const haloGeo = new THREE.TorusGeometry(0.16, 0.02, 6, 16);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.44, 0.32);
      catGroup.add(halo);

      catGroup.position.set((Math.random() - 0.5) * 12, 3.5 + i * 1.5, -6 + i * 4);
      this.group.add(catGroup);

      this.animatedObjects.wingedCats.push({
        group: catGroup,
        leftWing: leftWing,
        rightWing: rightWing,
        orbitRadius: 9.0 + i * 3.5,
        orbitSpeed: 0.18 + i * 0.05, // 느긋하고 평화로운 비행 속도
        heightBase: 3.5 + i * 1.2,
        phase: i * 2.0,
      });
    }
  }

  // 5. 둥실둥실 떠오르는 줄무늬 열기구 (Hot Air Balloon)
  _buildHotAirBalloon() {
    const balloonGroup = new THREE.Group();
    balloonGroup.position.set(-9, 5.5, -8);

    // 열기구 구체 (스트라이프 옐로우/핑크)
    const balloonGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const balloonMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
    const balloon = new THREE.Mesh(balloonGeo, balloonMat);
    balloon.scale.set(1.0, 1.25, 1.0);
    balloonGroup.add(balloon);

    // 바구니
    const basketMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), basketMat);
    basket.position.y = -3.2;
    basket.castShadow = true;
    balloonGroup.add(basket);

    // 연결 로프 4개
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.6), ropeMat);
        rope.position.set(i * 0.35, -2.4, j * 0.35);
        balloonGroup.add(rope);
      }
    }

    this.group.add(balloonGroup);
    this.animatedObjects.hotAirBalloon = balloonGroup;
  }

  // 6. 둥실둥실 흘러가는 입체 솜사탕 구름들
  _buildFluffyClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
    });

    for (let i = 0; i < 5; i++) {
      const cGroup = new THREE.Group();
      cGroup.position.set((Math.random() - 0.5) * 40, -1.5 + Math.random() * 8, (Math.random() - 0.5) * 40);

      const puffs = [
        { x: 0, y: 0, z: 0, r: 1.8 },
        { x: 1.4, y: -0.2, z: 0, r: 1.4 },
        { x: -1.3, y: -0.2, z: 0, r: 1.3 },
        { x: 0.5, y: 0.8, z: 0.2, r: 1.2 },
      ];
      puffs.forEach((p) => {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(p.r, 1), cloudMat);
        puff.position.set(p.x, p.y, p.z);
        cGroup.add(puff);
      });

      this.group.add(cGroup);
      this.animatedObjects.clouds.push({ group: cGroup, speed: 0.3 + Math.random() * 0.2 });
    }
  }

  // 7. 천공에 떠 있는 반짝이는 3D 황금 별사탕들
  _buildGoldenStars() {
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const starGeo = new THREE.OctahedronGeometry(0.35, 0);

    for (let i = 0; i < 12; i++) {
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set((Math.random() - 0.5) * 22, 1.2 + Math.random() * 4, (Math.random() - 0.5) * 22);
      this.group.add(star);
      this.animatedObjects.stars.push(star);
    }
  }

  _initColliders() {
    // 천공섬 바깥 낭떠러지 낙하 방지
    // isColliding에서 메인섬(r=8.5)과 무지개다리, 서브섬(13.5, r=3.5) 밖이면 차단
  }

  // 메인섬, 무지개다리, 서브섬 밖은 허공 낙하이므로 충돌 차단
  isColliding(x, z, radius) {
    // 1. 메인 천공섬 내부 (원형 반경 8.3)
    if (Math.hypot(x, z) < 8.3 - radius) return false;

    // 2. 무지개 아치 다리 위 (x: 6.0 ~ 11.0, |z| < 1.1)
    if (x >= 6.0 && x <= 11.0 && Math.abs(z) < 1.1 - radius) return false;

    // 3. 동쪽 서브 구름섬 내부 (중심: 13.5, 0, 반경 3.3)
    if (Math.hypot(x - 13.5, z) < 3.3 - radius) return false;

    // 그 외는 낭떠러지 허공이므로 이동 차단
    return true;
  }

  isInsideWater(x, z) {
    return false;
  }

  // 무지개 아치 다리 오르내리기 높이맵
  getHeightAt(x, z) {
    // 무지개 다리 (x: 6.0 ~ 11.0, |z| < 1.2)
    if (x >= 6.0 && x <= 11.0 && Math.abs(z) < 1.2) {
      const t = (x - 8.5) / 2.5; // -1.0 ~ 1.0
      const clampedT = Math.max(-1, Math.min(1, t));
      // 아치 정점 높이 0.95m
      return Math.cos(clampedT * Math.PI * 0.48) * 0.95 + 0.05;
    }
    // 서브 구름섬 지표면
    if (Math.hypot(x - 13.5, z) < 3.3) {
      return 0.4;
    }
    return 0;
  }

  update(dt, elapsed) {
    // 1. 날개 달린 고양이 비행 & 날갯짓
    this.animatedObjects.wingedCats.forEach((c) => {
      const angle = elapsed * c.orbitSpeed + c.phase;
      c.group.position.x = Math.sin(angle) * c.orbitRadius;
      c.group.position.z = Math.cos(angle) * (c.orbitRadius * 0.7);
      c.group.position.y = c.heightBase + Math.sin(elapsed * 2.5 + c.phase) * 0.4;
      c.group.rotation.y = -angle + Math.PI / 2;

      // 우아하고 여유로운 날갯짓
      const flap = Math.sin(elapsed * 4.5 + c.phase) * 0.35;
      c.leftWing.rotation.z = flap;
      c.rightWing.rotation.z = -flap;
    });

    // 2. 열기구 둥실둥실 부유
    if (this.animatedObjects.hotAirBalloon) {
      this.animatedObjects.hotAirBalloon.position.y = 5.5 + Math.sin(elapsed * 1.2) * 0.45;
      this.animatedObjects.hotAirBalloon.rotation.y += dt * 0.1;
    }

    // 3. 흘러가는 솜사탕 구름
    this.animatedObjects.clouds.forEach((c) => {
      c.group.position.x += c.speed * dt * 2.0;
      if (c.group.position.x > 30) c.group.position.x = -30;
    });

    // 4. 반짝이는 별사탕 회전
    this.animatedObjects.stars.forEach((s, idx) => {
      s.rotation.y += dt * (1.0 + idx * 0.1);
      s.rotation.x += dt * 0.8;
    });

    // 메인섬 미세한 공중 호흡
    if (this.mainIsland) {
      this.mainIsland.position.y = Math.sin(elapsed * 0.8) * 0.04;
    }
    if (this.subIsland) {
      this.subIsland.position.y = 0.4 + Math.cos(elapsed * 0.9) * 0.04;
    }
  }

  destroy() {}
}

