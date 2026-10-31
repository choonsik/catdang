import * as THREE from 'three';

export class ParkWorld {
  constructor(scene) {
    this.scene = scene;
    this.id = 'park';
    this.name = '평화 공원';
    this.icon = '🌳';
    this.desc = '파릇파릇한 잔디와 연못, 아치 다리가 있는 따뜻한 2.5D 공원';
    this.background = 0xe0f2fe; // 화사한 하늘색

    this.group = new THREE.Group();
    this.fountains = [];
    this.waterMeshes = [];
    this.colliders = [];
    this.spawnPoint = [0, 0];

    this.waypoints = [
      [-2.5, 4.5], [0, 6.0], [0, 0], [4.0, 2.0], [6.0, 4.0],
      [0, -4.0], [-4.0, -2.0], [3.0, -8.0], [-2.0, -8.0],
      [6.0, -2.0], [-6.0, 0.0], [-1.0, 10.0], [2.0, 10.0],
      [-8.0, 5.0], [-12.0, 5.0],
    ];

    this._build();
  }

  _build() {
    this._buildLighting();
    this._buildGroundAndRoads();
    this._buildPondAndBridge();
    this._buildSnackBooth();
    this._buildPlayground();
    this._buildPicnicArea();
    this._buildFountain();
    this._buildTreesAndBushes();
    this._buildLampsAndDecor();
    this._initColliders();
  }

  _buildLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86b049, 1.1);
    hemiLight.position.set(0, 50, 0);
    this.group.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.25);
    dirLight.position.set(24, 38, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0002;
    const d = 26;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 80;
    this.group.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xbbe1fa, 0.45);
    fillLight.position.set(-20, 20, -20);
    this.group.add(fillLight);
  }

  _buildGroundAndRoads() {
    // 1. 파릇파릇한 넓은 잔디 지표면
    const groundGeo = new THREE.PlaneGeometry(64, 64);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x82be42 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. 따뜻하고 자연스러운 공원 흙/자갈 산책로 (따스한 아이보리 베이지 톤)
    const pathMat = new THREE.MeshLambertMaterial({ color: 0xfef3c7 }); // 따스한 크림 베이지
    const stepStoneMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }); // 둥근 자연석 디딤돌

    // 중앙 원형 분수 광장 (지름 8m 둥근 자갈 마당)
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), pathMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.01, 0);
    plaza.receiveShadow = true;
    this.group.add(plaza);

    // 자연스럽게 이어지는 곡선 오솔길 스트립들 (직선 시멘트 연석 제거!)
    const createCurvedPath = (width, length, x, z, rotY) => {
      const path = new THREE.Mesh(new THREE.PlaneGeometry(width, length, 8, 1), pathMat);
      path.rotation.x = -Math.PI / 2;
      path.rotation.z = rotY;
      path.position.set(x, 0.012, z);
      path.receiveShadow = true;
      this.group.add(path);
    };

    // (1) 북쪽 분수대(0, -10.5)로 이어지는 완만한 산책로
    createCurvedPath(2.8, 11, 0, -5.5, 0);

    // (2) 남쪽 정문으로 이어지는 산책로
    createCurvedPath(2.8, 10, 0, 5.0, 0);

    // (3) 서쪽 연못 다리(-8, 5)로 이어지는 산책로
    createCurvedPath(2.4, 8.5, -4.2, 2.5, Math.PI / 3.8);

    // (4) 동쪽 츄르 매점(8.5, -4.5) 및 피크닉장(7.5, 5.5)으로 이어지는 오솔길
    createCurvedPath(2.4, 9, 4.5, -2.2, -Math.PI / 3.5);
    createCurvedPath(2.4, 8, 4.2, 3.2, Math.PI / 4.2);

    // 길가에 아기자기하게 놓인 둥근 자연석 디딤돌들
    const steps = [
      [-1.8, 0], [1.8, 0], [0, -1.8], [0, 1.8],
      [-5.5, 4.0], [-7.0, 4.8], // 다리 입구 디딤돌
      [6.8, -3.8], [7.2, 4.5],   // 매점과 피크닉 입구 디딤돌
    ];
    steps.forEach(([sx, sz]) => {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.52, 0.04, 12), stepStoneMat);
      stone.position.set(sx, 0.02, sz);
      stone.receiveShadow = true;
      this.group.add(stone);
    });
  }

  _buildPondAndBridge() {
    const pondGroup = new THREE.Group();
    pondGroup.position.set(-8, 0, 5);

    const rimMat = new THREE.MeshLambertMaterial({ color: 0x65a30d });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.12, 24), rimMat);
    rim.position.y = 0.04;
    rim.scale.set(1.1, 1, 0.85);
    rim.receiveShadow = true;
    pondGroup.add(rim);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.1, 24), waterMat);
    water.position.y = 0.08;
    water.scale.set(1.08, 1, 0.82);
    pondGroup.add(water);
    this.waterMeshes.push(water);

    // 연잎
    const lilyMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const flowerMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e });
    for (let i = 0; i < 6; i++) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.35 + Math.random() * 0.2, 8), lilyMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set((Math.random() - 0.5) * 5, 0.14, (Math.random() - 0.5) * 3);
      pondGroup.add(pad);

      if (i % 2 === 0) {
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.15, 6), flowerMat);
        fl.position.set(pad.position.x, 0.22, pad.position.z);
        pondGroup.add(fl);
      }
    }

    // 아치형 나무 다리
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, 0);

    const woodMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const railMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const postTopMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });

    const bridgeHalfLen = 4.6;
    const numPlanks = 24;

    for (let i = 0; i <= numPlanks; i++) {
      const t = (i / numPlanks) * 2 - 1;
      const x = t * bridgeHalfLen;
      const y = Math.cos(t * Math.PI * 0.45) * 0.75 + 0.06;

      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 2.0), woodMat);
      plank.position.set(x, y, 0);
      plank.rotation.z = -Math.sin(t * Math.PI * 0.45) * 0.38;
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    const railHalfLen = 3.5;
    const railSteps = 6;
    [-0.95, 0.95].forEach((zSide) => {
      for (let i = 0; i <= railSteps; i++) {
        const t = (i / railSteps) * 2 - 1;
        const x = t * railHalfLen;
        const y = Math.cos((x / bridgeHalfLen) * Math.PI * 0.45) * 0.75 + 0.06;

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.65, 6), railMat);
        post.position.set(x, y + 0.32, zSide);
        post.castShadow = true;
        bridgeGroup.add(post);

        if (i === 0 || i === railSteps) {
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), postTopMat);
          cap.position.set(x, y + 0.68, zSide);
          bridgeGroup.add(cap);
        }
      }

      for (let i = 0; i < railSteps; i++) {
        const t1 = (i / railSteps) * 2 - 1;
        const t2 = ((i + 1) / railSteps) * 2 - 1;
        const x1 = t1 * railHalfLen;
        const x2 = t2 * railHalfLen;
        const y1 = Math.cos((x1 / bridgeHalfLen) * Math.PI * 0.45) * 0.75 + 0.68;
        const y2 = Math.cos((x2 / bridgeHalfLen) * Math.PI * 0.45) * 0.75 + 0.68;

        const segLen = Math.hypot(x2 - x1, y2 - y1);
        const railSeg = new THREE.Mesh(new THREE.BoxGeometry(segLen, 0.06, 0.08), railMat);
        railSeg.position.set((x1 + x2) / 2, (y1 + y2) / 2, zSide);
        railSeg.rotation.z = Math.atan2(y2 - y1, x2 - x1);
        railSeg.castShadow = true;
        bridgeGroup.add(railSeg);
      }
    });

    pondGroup.add(bridgeGroup);
    this.group.add(pondGroup);
  }

  _buildSnackBooth() {
    const booth = new THREE.Group();
    booth.position.set(8.5, 0, -4.5);

    const woodMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const counterMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });

    const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 2.2), woodMat);
    base.position.y = 0.7;
    base.castShadow = true;
    base.receiveShadow = true;
    booth.add(base);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.12, 2.5), counterMat);
    counter.position.y = 1.42;
    counter.castShadow = true;
    booth.add(counter);

    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    [[-1.8, -1.0], [1.8, -1.0], [-1.8, 1.0], [1.8, 1.0]].forEach(([cx, cz]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), pillarMat);
      p.position.set(cx, 2.1, cz);
      booth.add(p);
    });

    const awningGroup = new THREE.Group();
    awningGroup.position.set(0, 2.9, 0);
    const stripeColors = [0xef4444, 0xfacc15, 0x38bdf8, 0xffffff];
    const numStripes = 8;
    const stripeWidth = 4.2 / numStripes;

    for (let i = 0; i < numStripes; i++) {
      const col = stripeColors[i % stripeColors.length];
      const mat = new THREE.MeshLambertMaterial({ color: col });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(stripeWidth, 0.08, 2.6), mat);
      stripe.position.set(-2.1 + stripeWidth / 2 + i * stripeWidth, 0, 0);
      stripe.rotation.x = 0.12;
      stripe.castShadow = true;
      awningGroup.add(stripe);
    }
    booth.add(awningGroup);

    const signMat = new THREE.MeshLambertMaterial({ color: 0xffedd5 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.08), signMat);
    sign.position.set(0, 2.65, 1.25);
    booth.add(sign);

    this.group.add(booth);
  }

  _buildPlayground() {
    const playArea = new THREE.Group();
    playArea.position.set(-7.5, 0, -8);

    const sandMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.02;
    sand.receiveShadow = true;
    playArea.add(sand);

    const towerMat = new THREE.MeshLambertMaterial({ color: 0xe11d48 });
    const slideMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });

    const towerPlatform = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.6), towerMat);
    towerPlatform.position.set(0, 0.75, 0);
    towerPlatform.castShadow = true;
    playArea.add(towerPlatform);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.2, 4), slideMat);
    roof.position.set(0, 2.1, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    playArea.add(roof);

    const slideSlope = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 2.6), slideMat);
    slideSlope.position.set(0, 0.65, 1.6);
    slideSlope.rotation.x = Math.PI / 6;
    slideSlope.castShadow = true;
    playArea.add(slideSlope);

    const seesawGroup = new THREE.Group();
    seesawGroup.position.set(2.8, 0, 0);
    const baseStand = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 6), new THREE.MeshLambertMaterial({ color: 0x475569 }));
    baseStand.position.y = 0.22;
    seesawGroup.add(baseStand);

    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 2.4), new THREE.MeshLambertMaterial({ color: 0x0284c7 }));
    plank.position.y = 0.45;
    plank.rotation.x = 0.2;
    plank.castShadow = true;
    seesawGroup.add(plank);

    playArea.add(seesawGroup);
    this.group.add(playArea);
  }

  _buildPicnicArea() {
    const picnicGroup = new THREE.Group();
    picnicGroup.position.set(7.5, 0, 5.5);

    const woodMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const umbrellaMat = new THREE.MeshLambertMaterial({ color: 0x10b981 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.2), woodMat);
    tableTop.position.y = 0.75;
    tableTop.castShadow = true;
    picnicGroup.add(tableTop);

    [-0.85, 0.85].forEach((zSide) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.4), woodMat);
      bench.position.set(0, 0.42, zSide);
      bench.castShadow = true;
      picnicGroup.add(bench);
    });

    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6);
    [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(lx, 0.35, lz);
      picnicGroup.add(leg);
    });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), whiteMat);
    pole.position.y = 1.1;
    picnicGroup.add(pole);

    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 8), umbrellaMat);
    umbrella.position.y = 2.4;
    umbrella.castShadow = true;
    picnicGroup.add(umbrella);

    this.group.add(picnicGroup);

    const createParkBench = (x, z, rotY = 0) => {
      const bench = new THREE.Group();
      bench.position.set(x, 0, z);
      bench.rotation.y = rotY;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.5), woodMat);
      seat.position.y = 0.45;
      seat.castShadow = true;
      bench.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.06), woodMat);
      back.position.set(0, 0.75, -0.22);
      back.castShadow = true;
      bench.add(back);

      this.group.add(bench);
    };

    createParkBench(2.0, -5.0, -Math.PI / 2);
    createParkBench(-2.5, 1.8, Math.PI / 2);
    createParkBench(4.5, 0.5, 0);
  }

  _buildFountain() {
    const fountain = new THREE.Group();
    fountain.position.set(0, 0, -10.5);

    // 고급스러운 백옥 화이트 대리석 & 금빛 몰딩
    const marbleMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // 청량한 코발트 블루
      roughness: 0.1,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const waterWhiteMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
    });

    // 1. 하단 대형 원형 수조 (지름 5.4m)
    const basinOuter = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.55, 24), marbleMat);
    basinOuter.position.y = 0.275;
    basinOuter.castShadow = true;
    basinOuter.receiveShadow = true;
    fountain.add(basinOuter);

    // 수조 상단 금빛 림(Rim) 몰딩
    const basinRim = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.08, 8, 32), goldMat);
    basinRim.rotation.x = Math.PI / 2;
    basinRim.position.y = 0.55;
    fountain.add(basinRim);

    // 하단 수조 찰랑이는 에메랄드 물
    const basinWater = new THREE.Mesh(new THREE.CircleGeometry(2.45, 24), waterMat);
    basinWater.rotation.x = -Math.PI / 2;
    basinWater.position.y = 0.46;
    fountain.add(basinWater);
    this.waterMeshes.push(basinWater);

    // 수면 동심원 파문 링 (Ripples)
    this.fountainRipples = [];
    for (let i = 0; i < 2; i++) {
      const ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.8 + i * 0.7, 0.86 + i * 0.7, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.y = 0.47;
      fountain.add(ripple);
      this.fountainRipples.push({ mesh: ripple, baseRadius: 0.8 + i * 0.7 });
    }

    // 2. 중앙 1단 조각 기둥
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 1.1, 16), marbleMat);
    pillar1.position.y = 0.95;
    pillar1.castShadow = true;
    fountain.add(pillar1);

    // 3. 2단 중간 분수 대야
    const bowl1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.85, 0.38, 20), marbleMat);
    bowl1.position.y = 1.45;
    bowl1.castShadow = true;
    fountain.add(bowl1);

    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.05, 8, 24), goldMat);
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.y = 1.64;
    fountain.add(bowlRim);

    const bowlWater = new THREE.Mesh(new THREE.CircleGeometry(1.35, 20), waterMat);
    bowlWater.rotation.x = -Math.PI / 2;
    bowlWater.position.y = 1.62;
    fountain.add(bowlWater);

    // 4. 중앙 2단 상단 기둥
    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.7, 12), marbleMat);
    pillar2.position.y = 1.95;
    fountain.add(pillar2);

    // 5. [시그니처] 최상단 황금 고양이 조각상 (Golden Cat Statue)
    const statueGroup = new THREE.Group();
    statueGroup.position.set(0, 2.3, 0);

    const catGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.7,
      roughness: 0.25,
    });

    // 냥이 몸통
    const sBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.38, 6, 8), catGoldMat);
    sBody.position.y = 0.28;
    statueGroup.add(sBody);

    // 냥이 머리 & 귀
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), catGoldMat);
    sHead.position.set(0, 0.58, 0.08);
    statueGroup.add(sHead);

    const sEarGeo = new THREE.ConeGeometry(0.06, 0.12, 4);
    const sEarL = new THREE.Mesh(sEarGeo, catGoldMat);
    sEarL.position.set(-0.08, 0.72, 0.08);
    statueGroup.add(sEarL);

    const sEarR = sEarL.clone();
    sEarR.position.x = 0.08;
    statueGroup.add(sEarR);

    // 꼬리
    const sTail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6), catGoldMat);
    sTail.position.set(0, 0.3, -0.22);
    sTail.rotation.x = -Math.PI / 3;
    statueGroup.add(sTail);

    fountain.add(statueGroup);

    // 6. [화려한 분수 물줄기 시스템]
    // (1) 중앙에서 하늘 높이 솟구치는 물기둥 (Central Jet Streams)
    this.centralJets = [];
    for (let i = 0; i < 3; i++) {
      const jet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08 - i * 0.02, 0.12 - i * 0.02, 1.2, 8),
        waterWhiteMat
      );
      jet.position.set(0, 3.1 + i * 0.3, 0);
      fountain.add(jet);
      this.centralJets.push({ mesh: jet, baseY: 3.1 + i * 0.3, speed: 6.0 + i * 1.5 });
    }

    // 꼭대기 물보라 왕관 (Crown Spray)
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), waterWhiteMat);
      droplet.position.set(Math.cos(ang) * 0.35, 3.6, Math.sin(ang) * 0.35);
      fountain.add(droplet);
      this.fountains.push(droplet);
    }

    // (2) 2단 대야에서 아래 수조로 쏟아지는 8가닥 폭포 물줄기 (Cascading Streams)
    this.cascadeStreams = [];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const streamGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.15, 6);
      const stream = new THREE.Mesh(streamGeo, waterWhiteMat);
      // 살짝 바깥으로 포물선을 그리며 떨어지도록 기울임
      stream.position.set(Math.cos(ang) * 1.45, 1.05, Math.sin(ang) * 1.45);
      stream.rotation.z = Math.cos(ang) * 0.12;
      stream.rotation.x = -Math.sin(ang) * 0.12;
      fountain.add(stream);
      this.cascadeStreams.push({ mesh: stream, baseScaleY: 1.0, phase: i * 0.8 });
    }

    this.group.add(fountain);
  }

  _buildTreesAndBushes() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const greenMat = new THREE.MeshLambertMaterial({ color: 0x65a30d });
    const limeMat = new THREE.MeshLambertMaterial({ color: 0x84cc16 });
    const orangeMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });
    const pineMat = new THREE.MeshLambertMaterial({ color: 0x15803d });

    const createFluffyTree = (x, z, scale = 1.0, leafColorMat = greenMat) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 2.2 * scale, 8), trunkMat);
      trunk.position.y = 1.1 * scale;
      trunk.castShadow = true;
      tree.add(trunk);

      const topPositions = [
        [0, 2.8, 0, 1.2],
        [-0.5, 2.3, 0.4, 0.9],
        [0.5, 2.4, -0.3, 0.95],
        [0.2, 3.2, 0.2, 0.9],
      ];
      topPositions.forEach(([tx, ty, tz, r]) => {
        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(r * scale, 1), leafColorMat);
        leaf.position.set(tx * scale, ty * scale, tz * scale);
        leaf.castShadow = true;
        tree.add(leaf);
      });

      this.group.add(tree);
    };

    const createPineTree = (x, z, scale = 1.0) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.25 * scale, 1.6 * scale, 6), trunkMat);
      trunk.position.y = 0.8 * scale;
      trunk.castShadow = true;
      tree.add(trunk);

      [
        [1.6, 1.5, 1.2],
        [2.3, 1.2, 1.1],
        [3.0, 0.9, 1.0],
      ].forEach(([y, r, h]) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r * scale, h * scale, 6), pineMat);
        cone.position.y = y * scale;
        cone.castShadow = true;
        tree.add(cone);
      });

      this.group.add(tree);
    };

    const treeCoords = [
      [-14, -12, 1.3, greenMat], [-12, -16, 1.1, limeMat], [-16, -8, 1.2, pineMat],
      [14, -12, 1.3, orangeMat], [16, -8, 1.1, greenMat], [12, -15, 1.2, limeMat],
      [-14, 12, 1.2, limeMat], [-16, 8, 1.3, pineMat], [-12, 15, 1.1, greenMat],
      [14, 12, 1.2, greenMat], [16, 8, 1.3, orangeMat], [12, 15, 1.1, pineMat],
      [-4.5, -4.5, 0.95, limeMat], [4.5, -9.0, 1.0, orangeMat], [-3.5, 10.5, 1.05, greenMat],
    ];

    treeCoords.forEach(([x, z, s, mat]) => {
      if (mat === pineMat) createPineTree(x, z, s);
      else createFluffyTree(x, z, s, mat);
    });

    const flowerBedGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.25, 12);
    const flowerBedMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const soilMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });

    const createFlowerBed = (x, z) => {
      const bed = new THREE.Group();
      bed.position.set(x, 0, z);

      const rim = new THREE.Mesh(flowerBedGeo, flowerBedMat);
      rim.position.y = 0.12;
      rim.receiveShadow = true;
      bed.add(rim);

      const soil = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), soilMat);
      soil.rotation.x = -Math.PI / 2;
      soil.position.y = 0.25;
      bed.add(soil);

      const colors = [0xef4444, 0xfacc15, 0xec4899];
      for (let i = 0; i < 7; i++) {
        const fl = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          new THREE.MeshLambertMaterial({ color: colors[i % colors.length] })
        );
        const ang = (i / 7) * Math.PI * 2;
        const rad = 0.65;
        fl.position.set(Math.cos(ang) * rad, 0.35, Math.sin(ang) * rad);
        bed.add(fl);
      }

      this.group.add(bed);
    };

    createFlowerBed(-2.5, -2.5);
    createFlowerBed(2.5, 2.5);
  }

  _buildLampsAndDecor() {
    const lampMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const createStreetLamp = (x, z) => {
      const lamp = new THREE.Group();
      lamp.position.set(x, 0, z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.8, 6), lampMat);
      pole.position.y = 1.4;
      pole.castShadow = true;
      lamp.add(pole);

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 4), lampMat);
      head.position.y = 2.85;
      lamp.add(head);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), bulbMat);
      bulb.position.y = 2.75;
      lamp.add(bulb);

      this.group.add(lamp);
    };

    createStreetLamp(1.6, -8.0);
    createStreetLamp(-1.6, 8.0);
    createStreetLamp(-4.0, 1.8);
    createStreetLamp(4.0, -1.8);
  }

  _initColliders() {
    this.colliders.push({ type: 'box', minX: 8.5 - 2.1, maxX: 8.5 + 2.1, minZ: -4.5 - 1.4, maxZ: -4.5 + 1.4 });
    this.colliders.push({ type: 'circle', x: 0, z: -10.5, radius: 2.6 });
    this.colliders.push({ type: 'box', minX: -7.5 - 1.1, maxX: -7.5 + 1.1, minZ: -8.0 - 1.1, maxZ: -8.0 + 1.1 });
    this.colliders.push({ type: 'box', minX: 7.5 - 1.2, maxX: 7.5 + 1.2, minZ: 5.5 - 0.9, maxZ: 5.5 + 0.9 });

    const treeCoords = [
      [-14, -12], [-12, -16], [-16, -8],
      [14, -12], [16, -8], [12, -15],
      [-14, 12], [-16, 8], [-12, 15],
      [14, 12], [16, 8], [12, 15],
      [-4.5, -4.5], [4.5, -9.0], [-3.5, 10.5],
    ];
    treeCoords.forEach(([tx, tz]) => {
      this.colliders.push({ type: 'circle', x: tx, z: tz, radius: 0.65 });
    });

    const lampCoords = [
      [1.6, -8.0], [-1.6, 8.0], [-4.0, 1.8], [4.0, -1.8],
    ];
    lampCoords.forEach(([lx, lz]) => {
      this.colliders.push({ type: 'circle', x: lx, z: lz, radius: 0.35 });
    });
  }

  isInsideBridge(x, z) {
    const bridgeX = -8;
    const bridgeZ = 5;
    const halfLen = 5.0;
    const halfWidth = 1.15;
    return (
      x >= bridgeX - halfLen &&
      x <= bridgeX + halfLen &&
      z >= bridgeZ - halfWidth &&
      z <= bridgeZ + halfWidth
    );
  }

  isInsideWater(x, z) {
    if (this.isInsideBridge(x, z)) return false;
    const pondX = -8;
    const pondZ = 5;
    const rx = 4.2;
    const rz = 3.3;
    const dx = (x - pondX) / rx;
    const dz = (z - pondZ) / rz;
    return dx * dx + dz * dz < 1.0;
  }

  getHeightAt(x, z) {
    if (this.isInsideBridge(x, z)) {
      const bridgeX = -8;
      const t = (x - bridgeX) / 4.8;
      const clampedT = Math.max(-1, Math.min(1, t));
      return Math.cos(clampedT * Math.PI * 0.45) * 0.75 + 0.06;
    }
    return 0;
  }

  update(dt, elapsed) {
    // 1. 꼭대기 물보라 왕관 물방울들
    this.fountains.forEach((spray, idx) => {
      spray.position.y = 3.6 + Math.sin(elapsed * 7 + idx * 1.2) * 0.22;
      spray.scale.setScalar(0.9 + Math.sin(elapsed * 8 + idx) * 0.2);
    });

    // 2. 중앙 하늘 높이 솟구치는 물기둥 분출
    if (this.centralJets) {
      this.centralJets.forEach((jet, idx) => {
        jet.mesh.scale.y = 1.0 + Math.sin(elapsed * 8.0 + idx * 1.5) * 0.35;
        jet.mesh.position.y = jet.baseY + Math.sin(elapsed * 6.0 + idx) * 0.12;
      });
    }

    // 3. 2단 대야에서 아래로 쏟아지는 8가닥 폭포 물줄기
    if (this.cascadeStreams) {
      this.cascadeStreams.forEach((stream) => {
        stream.mesh.scale.y = 1.0 + Math.sin(elapsed * 10.0 + stream.phase) * 0.15;
      });
    }

    // 4. 수면 동심원 파문 링 퍼짐
    if (this.fountainRipples) {
      this.fountainRipples.forEach((ripple, idx) => {
        const t = (elapsed * 1.2 + idx * 0.6) % 1.0;
        const scale = 1.0 + t * 0.8;
        ripple.mesh.scale.set(scale, scale, 1.0);
        ripple.mesh.material.opacity = Math.max(0, 0.45 * (1.0 - t));
      });
    }

    // 연못 및 수조 물결 미세 출렁임
    this.waterMeshes.forEach((water) => {
      water.position.y = (water.position.y > 0.3 ? 0.46 : 0.08) + Math.sin(elapsed * 2.0) * 0.01;
    });
  }
}

