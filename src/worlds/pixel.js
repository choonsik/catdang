import * as THREE from 'three';

// 8비트 레트로 픽셀 아트 감성의 도트 월드
export class PixelWorld {
  constructor(scene) {
    this.scene = scene;
    this.id = 'pixel';
    this.name = '레트로 도트 마을';
    this.icon = '👾';
    this.desc = '8비트 게임 속으로 들어온 듯 아기자기한 레트로 픽셀 세상';
    this.background = 0x60a5fa; // 8비트 청명한 하늘색

    this.group = new THREE.Group();
    this.colliders = [];
    this.spawnPoint = [0, 0];

    this.waypoints = [
      [0, 0], [4, 4], [-4, 4], [4, -4], [-4, -4],
      [0, 6], [0, -6], [8, 0], [-8, 0], [6, -6], [-6, 6]
    ];

    this._build();
  }

  _build() {
    this._buildLighting();
    this._buildPixelGround();
    this._buildPixelHouse();
    this._buildPixelTrees();
    this._buildPixelPondAndSteppingStones();
    this._buildPixelFlowers();
    this._buildPixelSign();
    this._initColliders();
  }

  _buildLighting() {
    // 픽셀 아트 특유의 선명한 대비 조명
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x4ade80, 1.2);
    hemiLight.position.set(0, 50, 0);
    this.group.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    dirLight.position.set(20, 35, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.group.add(dirLight);
  }

  // 픽셀 격자 바닥
  _buildPixelGround() {
    // 바닥 큰 판
    const groundGeo = new THREE.PlaneGeometry(54, 54);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 }); // 8비트 그린
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 격자 픽셀 패스 (보도블록 도트 타일들)
    const dotMat1 = new THREE.MeshLambertMaterial({ color: 0xfef08a }); // 연노랑 픽셀
    const dotMat2 = new THREE.MeshLambertMaterial({ color: 0xfde047 }); // 진노랑 픽셀

    for (let x = -10; x <= 10; x += 2) {
      for (let z = -10; z <= 10; z += 2) {
        if (Math.abs(x) <= 2 || Math.abs(z) <= 2) {
          const mat = (x + z) % 4 === 0 ? dotMat1 : dotMat2;
          const tile = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.8), mat);
          tile.position.set(x, 0.02, z);
          tile.receiveShadow = true;
          this.group.add(tile);
        }
      }
    }
  }

  // 픽셀 캣 하우스
  _buildPixelHouse() {
    const house = new THREE.Group();
    house.position.set(6, 0, -6);

    const wallMat = new THREE.MeshLambertMaterial({ color: 0xffedd5 });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e }); // 빨간 픽셀 지붕
    const earMat = new THREE.MeshLambertMaterial({ color: 0xe11d48 });
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x78350f });

    // 벽체 (계단식 픽셀 박스)
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.6, 4.0), wallMat);
    base.position.y = 1.3;
    base.castShadow = true;
    base.receiveShadow = true;
    house.add(base);

    // 문
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.1), doorMat);
    door.position.set(0, 0.8, 2.05);
    house.add(door);

    // 픽셀 지붕 층층이 (3단계 피라미드 스텝)
    [
      { y: 2.8, size: 4.8, h: 0.4 },
      { y: 3.2, size: 3.6, h: 0.4 },
      { y: 3.6, size: 2.4, h: 0.4 },
    ].forEach((step) => {
      const r = new THREE.Mesh(new THREE.BoxGeometry(step.size, step.h, step.size), roofMat);
      r.position.y = step.y;
      r.castShadow = true;
      house.add(r);
    });

    // 지붕 위 고양이 픽셀 귀 2개!
    [-1.0, 1.0].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), earMat);
      ear.position.set(side, 4.2, 0);
      ear.castShadow = true;
      house.add(ear);
    });

    this.group.add(house);
    this.houseGroup = house;
  }

  // 픽셀 트리 (각진 큐브 층들로 쌓인 도트 나무)
  _buildPixelTrees() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const leafMat1 = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x16a34a });

    const createPixelTree = (x, z) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      // 통나무 기둥
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 0.6), trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      tree.add(trunk);

      // 잎사귀 3단 픽셀 박스
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 2.8), leafMat1);
      b1.position.y = 2.4;
      b1.castShadow = true;
      tree.add(b1);

      const b2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 2.0), leafMat2);
      b2.position.y = 3.2;
      b2.castShadow = true;
      tree.add(b2);

      const b3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), leafMat1);
      b3.position.y = 4.0;
      b3.castShadow = true;
      tree.add(b3);

      this.group.add(tree);
    };

    const treePositions = [
      [-10, -8], [-8, -12], [-12, -4],
      [10, 8], [8, 12], [12, 4],
      [-10, 8], [-8, 10], [-12, 6],
      [10, -10], [-4, 12]
    ];
    treePositions.forEach(([x, z]) => createPixelTree(x, z));
  }

  // 각진 픽셀 연못과 징검다리
  _buildPixelPondAndSteppingStones() {
    const pondGroup = new THREE.Group();
    pondGroup.position.set(-7, 0, -5);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.1,
    });
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

    // 픽셀 연못 수면 (계단식 십자/타원 픽셀)
    const water = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 4.8), waterMat);
    water.position.y = 0.05;
    pondGroup.add(water);

    // 징검다리 픽셀 큐브들 (건널 수 있는 스팟)
    for (let i = -2; i <= 2; i++) {
      const stone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), stoneMat);
      stone.position.set(i * 1.1, 0.12, 0);
      stone.castShadow = true;
      stone.receiveShadow = true;
      pondGroup.add(stone);
    }

    this.group.add(pondGroup);
  }

  // 픽셀 꽃들 (십자 도트 형태)
  _buildPixelFlowers() {
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const petalColors = [0xef4444, 0xfacc15, 0xec4899, 0xa855f7];

    const createFlower = (x, z) => {
      const fl = new THREE.Group();
      fl.position.set(x, 0, z);

      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), stemMat);
      stem.position.y = 0.25;
      fl.add(stem);

      const col = petalColors[(Math.random() * petalColors.length) | 0];
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), new THREE.MeshLambertMaterial({ color: col }));
      head.position.y = 0.55;
      fl.add(head);

      this.group.add(fl);
    };

    for (let i = 0; i < 16; i++) {
      const fx = (Math.random() - 0.5) * 22;
      const fz = (Math.random() - 0.5) * 22;
      if (Math.abs(fx) > 3 || Math.abs(fz) > 3) {
        createFlower(fx, fz);
      }
    }
  }

  // 픽셀 팻말
  _buildPixelSign() {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const boardMat = new THREE.MeshLambertMaterial({ color: 0xffedd5 });

    const sign = new THREE.Group();
    sign.position.set(-2, 0, 2);

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), woodMat);
    post.position.y = 0.7;
    sign.add(post);

    const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.15), boardMat);
    board.position.set(0, 1.2, 0);
    sign.add(board);

    this.group.add(sign);
  }

  _initColliders() {
    // 픽셀 하우스 충돌체
    this.colliders.push({ type: 'box', minX: 6 - 2.2, maxX: 6 + 2.2, minZ: -6 - 2.2, maxZ: -6 + 2.2 });
    // 픽셀 연못 물가 충돌체 (다리 징검다리 외)
    this.colliders.push({ type: 'box', minX: -7 - 3.2, maxX: -7 + 3.2, minZ: -5 - 2.4, maxZ: -5 - 0.6 });
    this.colliders.push({ type: 'box', minX: -7 - 3.2, maxX: -7 + 3.2, minZ: -5 + 0.6, maxZ: -5 + 2.4 });

    // 나무들
    const treePositions = [
      [-10, -8], [-8, -12], [-12, -4],
      [10, 8], [8, 12], [12, 4],
      [-10, 8], [-8, 10], [-12, 6],
      [10, -10], [-4, 12]
    ];
    treePositions.forEach(([tx, tz]) => {
      this.colliders.push({ type: 'circle', x: tx, z: tz, radius: 0.6 });
    });
  }

  isInsideWater(x, z) {
    // 연못 영역에서 징검다리 z in [-0.5, 0.5] 제외
    if (x >= -10.2 && x <= -3.8 && z >= -7.4 && z <= -2.6) {
      if (Math.abs(z - (-5)) <= 0.6) return false; // 징검다리 위는 통과
      return true;
    }
    return false;
  }

  getHeightAt(x, z) {
    // 징검다리 위 높이
    if (x >= -9.5 && x <= -4.5 && Math.abs(z - (-5)) <= 0.5) {
      return 0.15;
    }
    return 0;
  }

  update(dt, elapsed) {
    // 픽셀 연못 물결 반짝임
  }
}

