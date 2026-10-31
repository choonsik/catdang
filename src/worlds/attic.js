import * as THREE from 'three';

// 🪵 구름 위 포근 다락방 찻집 & 루프탑 테라스 (Cozy Rooftop Attic)
// - 벽난로와 찻상, 턴테이블이 있는 포근한 다락방 실내
// - 고양이가 폴짝폴짝 뛰어올라 최상단 구름 조망대까지 오를 수 있는 다양한 캣타워 & 캣워크 시스템!
export class AtticWorld {
  constructor(scene) {
    this.scene = scene;
    this.id = 'attic';
    this.name = '포근 다락방 찻집';
    this.icon = '🪵';
    this.desc = '타닥타닥 벽난로와 찻상, 계단을 밟고 오르는 다양한 캣타워와 루프탑 테라스';
    this.background = 0xfef3c7; // 따스한 오후 햇살 미색

    this.group = new THREE.Group();
    this.fireLights = [];
    this.colliders = [];
    this.platforms = [];
    this.animatedProps = []; // 모빌 등 흔들리는 장식

    // 넓은 통행로 러그 위 안전한 스폰 포인트
    this.spawnPoint = [0, 2.0];

    this.waypoints = [
      [0, 2.0], [3, 2.0], [-3, 2.0], [0, 6.0], [3, 7.5],
      [-3, 7.5], [0, -1.0], [4, -2.0], [-4, -2.0]
    ];

    this._build();
  }

  _build() {
    this._buildLighting();
    this._buildRoomAndTerrace();
    this._buildFireplace();
    this._buildFurniture();
    this._buildCatTowers();
    this._buildTerraceGarden();
    this._initColliders();
  }

  _buildLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x78350f, 1.15);
    hemiLight.position.set(0, 30, 0);
    this.group.add(hemiLight);

    // 테라스에서 방 안으로 쏟아지는 따스한 햇살
    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.35);
    sunLight.position.set(15, 25, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.group.add(sunLight);

    // 실내 은은한 오렌지 램프
    const warmLight = new THREE.PointLight(0xf59e0b, 1.3, 20);
    warmLight.position.set(0, 4.5, -2);
    this.group.add(warmLight);
  }

  _buildRoomAndTerrace() {
    // 1. 실내 목조 마루 (z: -12 ~ 2)
    const floorGeo = new THREE.PlaneGeometry(24, 14);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -5);
    floor.receiveShadow = true;
    this.group.add(floor);

    // 2. 남쪽 개방형 루프탑 야외 테라스 마루 (z: 2 ~ 12)
    const terraceGeo = new THREE.PlaneGeometry(24, 10);
    const terraceMat = new THREE.MeshLambertMaterial({ color: 0xd97706 }); // 햇살을 받은 밝은 목조 데크
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.rotation.x = -Math.PI / 2;
    terrace.position.set(0, 0.01, 7);
    terrace.receiveShadow = true;
    this.group.add(terrace);

    // 3. 실내 푹신한 원형 털 러그 (중앙 광장)
    const rugMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
    const rug = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.03, 1.5);
    rug.receiveShadow = true;
    this.group.add(rug);

    // 4. 벽체 구성: 2.5D 디오라마 뷰를 위해 카메라 시선 방향(오른쪽 동쪽, 앞쪽 남쪽)을 시원하게 오픈!
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x78350f });

    // 북쪽 뒷벽 (아늑한 다락방 깊이감 제공)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(24, 6.5, 0.4), wallMat);
    backWall.position.set(0, 3.25, -12);
    backWall.castShadow = true;
    this.group.add(backWall);

    // 서쪽 왼쪽 벽
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.5, 14), wallMat);
    westWall.position.set(-12, 3.25, -5);
    westWall.castShadow = true;
    this.group.add(westWall);

    // 🌟 주변 테두리를 깔끔한 1단 단층 벽돌(Brick Border)로 마감! (시야는 100% 트이고 경계는 단정하게 정리)
    const brickMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 }); // 따스한 적벽돌
    const brickCapMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }); // 단정한 상단 화강석 캡

    const createBrickBorder = (w, h, d, x, y, z) => {
      const borderGroup = new THREE.Group();
      borderGroup.position.set(x, y, z);

      // 1단 벽돌 본체 (높이 0.24m)
      const brick = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), brickMat);
      brick.position.y = h / 2;
      brick.castShadow = true;
      brick.receiveShadow = true;
      borderGroup.add(brick);

      // 벽돌 윗면 깔끔한 마감 캡
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + (w > d ? 0.08 : 0.04), 0.05, d + (d > w ? 0.08 : 0.04)), brickCapMat);
      cap.position.y = h + 0.025;
      cap.castShadow = true;
      borderGroup.add(cap);

      this.group.add(borderGroup);
    };

    // (1) 동쪽(오른쪽) 1단 벽돌 테두리 (z: -12 ~ 12, 총 24m)
    createBrickBorder(0.36, 0.24, 24.36, 12.0, 0, 0);

    // (2) 남쪽(앞쪽) 1단 벽돌 테두리 (x: -12 ~ 12, 총 24m)
    createBrickBorder(24.36, 0.24, 0.36, 0, 0, 12.0);

    // (3) 서쪽 테라스 1단 벽돌 테두리 (z: 2 ~ 12, 총 10m)
    createBrickBorder(0.36, 0.24, 10.0, -12.0, 0, 7.0);

    // 1단 벽돌 위도 냥이가 사뿐히 딛고 설 수 있도록 플랫폼 등록 (y = 0.29)
    this.platforms.push({ type: 'box', minX: 11.75, maxX: 12.25, minZ: -12.2, maxZ: 12.2, height: 0.29 });
    this.platforms.push({ type: 'box', minX: -12.2, maxX: 12.2, minZ: 11.75, maxZ: 12.25, height: 0.29 });
    this.platforms.push({ type: 'box', minX: -12.25, maxX: -11.75, minZ: 2.0, maxZ: 12.2, height: 0.29 });
  }

  // 벽난로 & 모닥불 (북쪽 벽에 밀착)
  _buildFireplace() {
    const fpGroup = new THREE.Group();
    fpGroup.position.set(0, 0, -11.2);

    const brickMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c });
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 1.2), brickMat);
    hearth.position.y = 1.3;
    hearth.castShadow = true;
    fpGroup.add(hearth);

    // 벽난로 상단 굴뚝 쉼터 (Mantle Shelf - 고양이가 캣워크 타고 올라갈 수 있는 명당!)
    const mantleMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const mantle = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 1.4), mantleMat);
    mantle.position.set(0, 2.6, 0.05);
    mantle.castShadow = true;
    fpGroup.add(mantle);

    // 화구
    const firebox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 1.0), new THREE.MeshBasicMaterial({ color: 0x18181b }));
    firebox.position.set(0, 0.85, 0.2);
    fpGroup.add(firebox);

    // 불꽃
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 6), flameMat);
    flame.position.set(0, 0.65, 0.2);
    fpGroup.add(flame);

    const fireLight = new THREE.PointLight(0xf97316, 2.2, 10);
    fireLight.position.set(0, 0.9, 0.6);
    fpGroup.add(fireLight);
    this.fireLights.push(fireLight);

    this.group.add(fpGroup);

    // 플랫폼 등록: 벽난로 상단 선반 (y = 2.6)
    this.platforms.push({
      type: 'box',
      minX: -2.0,
      maxX: 2.0,
      minZ: -11.8,
      maxZ: -10.4,
      height: 2.6
    });
  }

  // 가구들
  _buildFurniture() {
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x543d2b });
    const sofaMat = new THREE.MeshLambertMaterial({ color: 0x10b981 });

    // 1. 찻상 (북쪽 테이블)
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.4), woodMat);
    table.position.set(0, 0.2, -4.5);
    table.castShadow = true;
    this.group.add(table);

    // 찻잔 2개 & 냥이용 물그릇
    const cupMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.15, 8), cupMat);
    cup1.position.set(-0.5, 0.45, -4.5);
    this.group.add(cup1);

    const cup2 = cup1.clone();
    cup2.position.x = 0.5;
    this.group.add(cup2);

    // 고양이 전용 물그릇
    const bowlMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const catBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.12, 12), bowlMat);
    catBowl.position.set(0, 0.44, -4.3);
    this.group.add(catBowl);

    // 플랫폼: 찻상 위 (y = 0.4)
    this.platforms.push({
      type: 'box',
      minX: -1.2,
      maxX: 1.2,
      minZ: -5.3,
      maxZ: -3.7,
      height: 0.4
    });

    // 2. 서쪽 창가 아늑한 에메랄드 소파
    const sofa = new THREE.Group();
    sofa.position.set(-7.5, 0, -3.5);
    sofa.rotation.y = Math.PI / 2;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 1.4), sofaMat);
    seat.position.y = 0.225;
    seat.castShadow = true;
    sofa.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 0.35), sofaMat);
    back.position.set(0, 0.85, -0.55);
    back.castShadow = true;
    sofa.add(back);

    this.group.add(sofa);

    // 플랫폼: 소파 시트 위 (y = 0.45)
    this.platforms.push({
      type: 'box',
      minX: -8.8,
      maxX: -6.2,
      minZ: -5.3,
      maxZ: -1.7,
      height: 0.45
    });

    // 3. 털실 뭉치 (장난감)
    const yarnMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
    const yarn = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), yarnMat);
    yarn.position.set(2.2, 0.24, 0.5);
    yarn.castShadow = true;
    this.group.add(yarn);
  }

  // 🐾 다양한 캣타워 시스템 구축 (루프탑 콘도, 나선형 타워, 벽면 캣워크, 미니 바스켓)
  _buildCatTowers() {
    this._buildDeluxeRooftopTower();
    this._buildSpiralCatTower();
    this._buildWallCatwalk();
    this._buildTerraceBasketTower();
  }

  // 1. [초대형 4단 루프탑 캣 콘도] (동쪽 테라스 정원: 8.0, 6.5)
  // - 1단 웰컴 데크(0.55m) -> 2단 원목 숨숨집 지붕(1.25m) -> 3단 캣 해먹(1.95m) -> 4단 최상층 구름 조망대(2.75m)
  _buildDeluxeRooftopTower() {
    const tower = new THREE.Group();
    tower.position.set(8.0, 0, 6.5);

    const woodDark = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const woodLight = new THREE.MeshLambertMaterial({ color: 0xfef08a }); // 포근한 바닐라 크림 펠트
    const sisalRope = new THREE.MeshLambertMaterial({ color: 0xd97706 }); // 황금빛 삼줄 스크래쳐
    const cushionMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 }); // 딸기우유 핑크 쿠션

    // 바닥 안정 베이스 판
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 2.2), woodDark);
    basePlate.position.y = 0.04;
    basePlate.receiveShadow = true;
    tower.add(basePlate);

    // 🌟 1단 디딤 발판 (y = 0.55) - 냥이가 바닥에서 쉽게 훌쩍 뛰어오를 수 있는 넓은 발판
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 10);
    const postOffsets = [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]];
    postOffsets.forEach(([px, pz]) => {
      const p = new THREE.Mesh(postGeo, sisalRope);
      p.position.set(px, 0.275, pz);
      p.castShadow = true;
      tower.add(p);
    });

    const plat1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.8), woodLight);
    plat1.position.y = 0.55;
    plat1.castShadow = true;
    tower.add(plat1);

    this.platforms.push({
      type: 'box',
      minX: 8.0 - 1.05,
      maxX: 8.0 + 1.05,
      minZ: 6.5 - 0.95,
      maxZ: 6.5 + 0.95,
      height: 0.55
    });

    // 🌟 2단 원목 숨숨집 (Condo Cube, 지붕 높이 y = 1.25)
    const condo = new THREE.Group();
    condo.position.set(-0.1, 0.55, 0);

    // 숨숨집 본체 박스 (가로 1.4, 높이 0.7, 깊이 1.3)
    const condoBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.3), woodDark);
    condoBox.position.y = 0.35;
    condoBox.castShadow = true;
    condo.add(condoBox);

    // 냥이 모양 둥근 출입문 홀
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), holeMat);
    hole.position.set(0, 0.35, 0.655);
    condo.add(hole);

    // 2단 지붕 펠트 패드 (y = 1.25)
    const condoRoof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 1.35), woodLight);
    condoRoof.position.y = 0.7;
    condo.add(condoRoof);

    tower.add(condo);

    this.platforms.push({
      type: 'box',
      minX: 8.0 - 0.8,
      maxX: 8.0 + 0.8,
      minZ: 6.5 - 0.75,
      maxZ: 6.5 + 0.75,
      height: 1.25
    });

    // 🌟 3단 라운드 캣 해먹 (y = 1.95)
    const pole3 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 10), sisalRope);
    pole3.position.set(0.4, 1.6, 0.2);
    pole3.castShadow = true;
    tower.add(pole3);

    const hammock = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.55, 0.12, 16), cushionMat);
    hammock.position.set(0.4, 1.95, 0.2);
    hammock.castShadow = true;
    tower.add(hammock);

    this.platforms.push({
      type: 'circle',
      x: 8.0 + 0.4,
      z: 6.5 + 0.2,
      radius: 0.65,
      height: 1.95
    });

    // 🌟 4단 최상층 구름 조망대 펜트하우스 (y = 2.75)
    // - 남쪽 푸른 하늘이 시원하게 열린 최고의 일광욕 뷰포인트!
    const pole4 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 10), sisalRope);
    pole4.position.set(-0.3, 2.35, -0.2);
    pole4.castShadow = true;
    tower.add(pole4);

    const topLounge = new THREE.Group();
    topLounge.position.set(-0.3, 2.75, -0.2);

    const topBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16), woodLight);
    topLounge.add(topBase);

    // 푹신한 외곽 테두리 림
    const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 8, 20), cushionMat);
    topRim.rotation.x = Math.PI / 2;
    topRim.position.y = 0.08;
    topLounge.add(topRim);

    tower.add(topLounge);

    this.platforms.push({
      type: 'circle',
      x: 8.0 - 0.3,
      z: 6.5 - 0.2,
      radius: 0.72,
      height: 2.75
    });

    // 쥐돌이 모빌 (3단 아래에 매달려 살랑살랑 흔들림)
    const mobileGroup = new THREE.Group();
    mobileGroup.position.set(0.4, 1.85, -0.3);

    const stringGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.45, 4);
    const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const str = new THREE.Mesh(stringGeo, stringMat);
    str.position.y = -0.22;
    mobileGroup.add(str);

    const mouseBody = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
    mouseBody.position.y = -0.45;
    mouseBody.scale.set(1.4, 0.8, 0.9);
    mobileGroup.add(mouseBody);

    tower.add(mobileGroup);
    this.animatedProps.push({ type: 'swing', obj: mobileGroup, speed: 2.8, amplitude: 0.25 });

    this.group.add(tower);
  }

  // 2. [나선형 스텝 캣타워 (Spiral Climbing Tower)] (실내 동북쪽: 8.5, -6.5)
  // - 굵은 중심 통나무 기둥 주위로 45도씩 회전하며 나선형으로 올라가는 4단 계단 + 최상단 원형 펜트하우스
  // - 빙글빙글 점프하며 스텝바이스텝으로 등반!
  _buildSpiralCatTower() {
    const spiral = new THREE.Group();
    spiral.position.set(8.5, 0, -6.5);

    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x543d2b });
    const stepMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
    const rimMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });

    // 중심 통나무 기둥 (높이 3.2m)
    const centerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 3.2, 12), trunkMat);
    centerPole.position.y = 1.6;
    centerPole.castShadow = true;
    spiral.add(centerPole);

    // 하단 지지 원판
    const baseDisk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.1, 16), trunkMat);
    baseDisk.position.y = 0.05;
    spiral.add(baseDisk);

    // 나선형 4단 발판 (높이 0.55 -> 1.1 -> 1.65 -> 2.2)
    const stepConfigs = [
      { angle: 0, height: 0.55 },
      { angle: Math.PI / 2, height: 1.1 },
      { angle: Math.PI, height: 1.65 },
      { angle: Math.PI * 1.5, height: 2.2 },
    ];

    stepConfigs.forEach((cfg) => {
      const rad = 0.65;
      const lx = Math.cos(cfg.angle) * rad;
      const lz = Math.sin(cfg.angle) * rad;

      // 원형 디딤판
      const stepMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 12), stepMat);
      stepMesh.position.set(lx, cfg.height, lz);
      stepMesh.castShadow = true;
      spiral.add(stepMesh);

      // 기둥 연결 브라켓
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.15), trunkMat);
      bracket.position.set(lx * 0.5, cfg.height - 0.06, lz * 0.5);
      bracket.rotation.y = -cfg.angle;
      spiral.add(bracket);

      // 플랫폼 등록
      this.platforms.push({
        type: 'circle',
        x: 8.5 + lx,
        z: -6.5 + lz,
        radius: 0.55,
        height: cfg.height
      });
    });

    // 🌟 최상단 원형 펜트하우스 라운지 (y = 2.75)
    const topFloor = new THREE.Group();
    topFloor.position.set(0, 2.75, 0);

    const topPlat = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 16), stepMat);
    topFloor.add(topPlat);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 8, 20), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.08;
    topFloor.add(rim);

    spiral.add(topFloor);

    this.platforms.push({
      type: 'circle',
      x: 8.5,
      z: -6.5,
      radius: 0.85,
      height: 2.75
    });

    this.group.add(spiral);
  }

  // 3. [벽면 클라이밍 캣워크 & 벽난로 공중 브릿지] (실내 북서쪽 벽면)
  // - 1단 스크래쳐 기둥(-10.2, -8.5, y=0.55) -> 2단 벽면 원목 점프대(-8.5, -11.0, y=1.25) ->
  //   3단 공중 원목 브릿지(-5.0, -11.2, y=1.95) -> 벽난로 위 상단 쉼터(0, -11.0, y=2.6)
  _buildWallCatwalk() {
    const catwalkGroup = new THREE.Group();

    const woodLight = new THREE.MeshLambertMaterial({ color: 0xfef08a });
    const woodShelf = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });

    // (1) 1단 스크래쳐 기둥 & 원형 디딤판
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.55, 10), ropeMat);
    post1.position.set(-10.2, 0.275, -8.5);
    catwalkGroup.add(post1);

    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12), woodLight);
    step1.position.set(-10.2, 0.55, -8.5);
    catwalkGroup.add(step1);

    this.platforms.push({
      type: 'circle',
      x: -10.2,
      z: -8.5,
      radius: 0.55,
      height: 0.55
    });

    // (2) 2단 벽면 원목 점프 선반 (Wall Mounted Shelf)
    const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.65), woodShelf);
    shelf2.position.set(-8.5, 1.25, -11.2);
    shelf2.castShadow = true;
    catwalkGroup.add(shelf2);

    this.platforms.push({
      type: 'box',
      minX: -8.5 - 0.8,
      maxX: -8.5 + 0.8,
      minZ: -11.2 - 0.4,
      maxZ: -11.2 + 0.4,
      height: 1.25
    });

    // (3) 3단 공중 원목 캣워크 브릿지 (깔끔한 무지주 플로팅 선반)
    const bridge3 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.65), woodShelf);
    bridge3.position.set(-5.0, 1.95, -11.2);
    bridge3.castShadow = true;
    catwalkGroup.add(bridge3);

    this.platforms.push({
      type: 'box',
      minX: -5.0 - 1.25,
      maxX: -5.0 + 1.25,
      minZ: -11.2 - 0.4,
      maxZ: -11.2 + 0.4,
      height: 1.95
    });

    this.group.add(catwalkGroup);
  }

  // 4. [테라스 미니 바스켓 캣타워] (서남쪽 테라스: -8.5, 4.5)
  // - 1단 스크래쳐 발판(y=0.55) -> 2단 원형 바구니 쉼터(y=1.2)
  _buildTerraceBasketTower() {
    const mini = new THREE.Group();
    mini.position.set(-8.5, 0, 4.5);

    const postMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const basketMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 }); // 산뜻한 하늘색 바스켓
    const cushionMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });

    // 1단 기둥 & 사각 발판 (y = 0.55)
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.55, 8), postMat);
    p1.position.y = 0.275;
    mini.add(p1);

    const plat1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), cushionMat);
    plat1.position.y = 0.55;
    mini.add(plat1);

    this.platforms.push({
      type: 'box',
      minX: -8.5 - 0.65,
      maxX: -8.5 + 0.65,
      minZ: 4.5 - 0.65,
      maxZ: 4.5 + 0.65,
      height: 0.55
    });

    // 2단 상부 기둥 & 바구니 (y = 1.2)
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 8), postMat);
    p2.position.set(0.1, 0.88, 0);
    mini.add(p2);

    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 0.25, 14), basketMat);
    basket.position.set(0.1, 1.2, 0);
    mini.add(basket);

    this.platforms.push({
      type: 'circle',
      x: -8.5 + 0.1,
      z: 4.5,
      radius: 0.65,
      height: 1.2
    });

    this.group.add(mini);
  }

  // 테라스 루프탑 정원 (썬베드, 화분들)
  _buildTerraceGarden() {
    // 1. 테라스 썬베드 (남쪽 하늘을 바라보는 힐링 벤치)
    const sunbedMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const sunbed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 2.6), sunbedMat);
    sunbed.position.set(-6.0, 0.2, 7.5);
    sunbed.rotation.x = 0.08;
    sunbed.castShadow = true;
    this.group.add(sunbed);

    this.platforms.push({
      type: 'box',
      minX: -6.0 - 0.75,
      maxX: -6.0 + 0.75,
      minZ: 7.5 - 1.35,
      maxZ: 7.5 + 1.35,
      height: 0.35
    });

    // 2. 초록 테라스 화분들
    const potMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const plantMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });

    const createPlant = (x, z) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.5, 8), potMat);
      pot.position.set(x, 0.25, z);
      this.group.add(pot);

      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), plantMat);
      bush.position.set(x, 0.65, z);
      this.group.add(bush);
    };

    createPlant(-10.5, 10.5);
    createPlant(-8.5, 10.5);
    createPlant(10.5, 10.5);
  }

  _initColliders() {
    // 1. 벽난로 본체 하단
    this.colliders.push({ type: 'box', minX: -2.0, maxX: 2.0, minZ: -12.0, maxZ: -10.5, topY: 2.6 });

    // 2. 가구 콜라이더 (상단 topY 지원으로 점프하여 올라설 수 있음)
    // 찻상
    this.colliders.push({ type: 'box', minX: -1.2, maxX: 1.2, minZ: -5.3, maxZ: -3.7, topY: 0.4 });
    // 소파
    this.colliders.push({ type: 'box', minX: -8.8, maxX: -6.2, minZ: -5.3, maxZ: -1.7, topY: 0.45 });
    // 썬베드
    this.colliders.push({ type: 'box', minX: -6.8, maxX: -5.2, minZ: 6.2, maxZ: 8.8, topY: 0.35 });

    // 3. 캣타워 중심 축 기둥들 (기둥 몸체는 관통 불가)
    this.colliders.push({ type: 'circle', x: 8.5, z: -6.5, radius: 0.28 }); // 나선형 타워 중심목
    this.colliders.push({ type: 'circle', x: 8.0, z: 6.5, radius: 0.25 }); // 럭셔리 콘도 중심축

    // 4. 다락방 외곽 벽 및 테라스 난간 경계 차단
    this.colliders.push({ type: 'box', minX: -13, maxX: 13, minZ: 12.0, maxZ: 14.0 }); // 남쪽 난간
    this.colliders.push({ type: 'box', minX: -13, maxX: 13, minZ: -13.0, maxZ: -11.8 }); // 북쪽 벽
    this.colliders.push({ type: 'box', minX: -13.0, maxX: -11.8, minZ: -13, maxZ: 13 }); // 서쪽 벽
    this.colliders.push({ type: 'box', minX: 11.8, maxX: 13.0, minZ: -13, maxZ: 13 }); // 동쪽 벽
  }

  isInsideWater(x, z) {
    return false;
  }

  // 🌟 고양이가 현재 Y 위치(currentY)에 따라 적절한 캣타워 발판/소파/테이블 위에 올라설 수 있는 3D 플랫폼 높이 판정
  getHeightAt(x, z, currentY = 0) {
    let bestHeight = 0;

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      let inside = false;

      if (p.type === 'box') {
        inside = (x >= p.minX && x <= p.maxX && z >= p.minZ && z <= p.maxZ);
      } else if (p.type === 'circle') {
        const dx = x - p.x;
        const dz = z - p.z;
        inside = (dx * dx + dz * dz <= p.radius * p.radius);
      }

      if (inside) {
        // 고양이가 점프하여 발판 상단 근처에 도달했거나(currentY >= p.height - 0.45)
        // 이미 발판 위에 서 있는 경우
        if (currentY >= p.height - 0.45) {
          if (p.height > bestHeight) {
            bestHeight = p.height;
          }
        }
      }
    }

    return bestHeight;
  }

  update(dt, elapsed) {
    // 1. 벽난로 불꽃 깜빡임
    this.fireLights.forEach((f) => {
      f.intensity = 2.0 + Math.sin(elapsed * 10) * 0.35;
    });

    // 2. 쥐돌이 모빌 살랑살랑 흔들림
    this.animatedProps.forEach((prop) => {
      if (prop.type === 'swing') {
        prop.obj.rotation.z = Math.sin(elapsed * prop.speed) * prop.amplitude;
        prop.obj.rotation.x = Math.cos(elapsed * prop.speed * 0.8) * (prop.amplitude * 0.4);
      }
    });
  }

  destroy() {}
}
