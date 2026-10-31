import * as THREE from 'three';
import { soundscape } from './audio.js';

// 일러스트 레퍼런스 스타일: 화사하고 아기자기한 아이소메트릭 파크 월드
export class ParkWorld {
  constructor(scene) {
    this.scene = scene;
    this.fountains = [];
    this.benches = [];
    this.waterMeshes = [];

    this._setupLighting();
    this._buildGroundAndRoads();
    this._buildPondAndBridge();
    this._buildSnackBooth();
    this._buildPlayground();
    this._buildPicnicArea();
    this._buildFountain();
    this._buildTreesAndBushes();
    this._buildLampsAndDecor();
  }

  _setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86b049, 1.1);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

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
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xbbe1fa, 0.45);
    fillLight.position.set(-20, 20, -20);
    this.scene.add(fillLight);
  }

  _buildGroundAndRoads() {
    const groundGeo = new THREE.PlaneGeometry(64, 64);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x82be42 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const roadMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

    const createRoadSegment = (w, l, x, z, rotY = 0) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(w, l), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = rotY;
      road.position.set(x, 0.01, z);
      road.receiveShadow = true;
      this.scene.add(road);

      const curb1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, l), curbMat);
      curb1.position.set(x - w / 2, 0.03, z);
      curb1.rotation.y = rotY;
      curb1.receiveShadow = true;
      this.scene.add(curb1);

      const curb2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, l), curbMat);
      curb2.position.set(x + w / 2, 0.03, z);
      curb2.rotation.y = rotY;
      curb2.receiveShadow = true;
      this.scene.add(curb2);
    };

    createRoadSegment(2.4, 28, 0, 0);
    createRoadSegment(2.4, 22, 6, 4, Math.PI / 2);
    createRoadSegment(2.0, 16, -6, -4, Math.PI / 2);
  }

  _buildPondAndBridge() {
    const pondGroup = new THREE.Group();
    pondGroup.position.set(-8, 0, 5);

    // 연못 잔디 경계석
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x65a30d });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.12, 24), rimMat);
    rim.position.y = 0.04;
    rim.scale.set(1.1, 1, 0.85);
    rim.receiveShadow = true;
    pondGroup.add(rim);

    // 연못 수면
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

    // 연잎 & 수련
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
    const postTopMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b }); // 기둥머리 장식

    const bridgeHalfLen = 4.6;
    const numPlanks = 24;

    // 1. 다리 발판 판자들
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

    // 2. 단정하고 깔끔한 난간 (다리 밖으로 절대 튀어나오지 않게 아치 안쪽 3.5m 범위로 제한!)
    const railHalfLen = 3.5;
    const railSteps = 6;

    [-0.95, 0.95].forEach((zSide) => {
      // 기둥들 세우기
      for (let i = 0; i <= railSteps; i++) {
        const t = (i / railSteps) * 2 - 1;
        const x = t * railHalfLen;
        const y = Math.cos((x / bridgeHalfLen) * Math.PI * 0.45) * 0.75 + 0.06;

        // 수직 기둥
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.65, 6), railMat);
        post.position.set(x, y + 0.32, zSide);
        post.castShadow = true;
        bridgeGroup.add(post);

        // 양 끝 큰 기둥 머리 둥근 장식
        if (i === 0 || i === railSteps) {
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), postTopMat);
          cap.position.set(x, y + 0.68, zSide);
          bridgeGroup.add(cap);
        }
      }

      // 난간 횡목 (Top Handrail) - 기둥 사이를 정확하게 연결
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
    this.scene.add(pondGroup);
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
    const corners = [
      [-1.8, -1.0], [1.8, -1.0], [-1.8, 1.0], [1.8, 1.0],
    ];
    corners.forEach(([cx, cz]) => {
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

    this.scene.add(booth);
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
    this.scene.add(playArea);
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

    this.scene.add(picnicGroup);

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

      this.scene.add(bench);
      this.benches.push({ position: new THREE.Vector3(x, 0.45, z) });
    };

    createParkBench(2.0, -5.0, -Math.PI / 2);
    createParkBench(-2.5, 1.8, Math.PI / 2);
    createParkBench(4.5, 0.5, 0);
  }

  _buildFountain() {
    const fountain = new THREE.Group();
    fountain.position.set(0, 0, -10.5);

    const stoneMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });

    const outer = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.5, 16), stoneMat);
    outer.position.y = 0.25;
    outer.castShadow = true;
    outer.receiveShadow = true;
    fountain.add(outer);

    const water = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.45;
    fountain.add(water);
    this.waterMeshes.push(water);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.2, 12), stoneMat);
    pillar.position.y = 0.85;
    fountain.add(pillar);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.7, 0.35, 12), stoneMat);
    bowl.position.y = 1.35;
    fountain.add(bowl);

    const sprayMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 4; i++) {
      const spray = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), sprayMat);
      spray.position.set((Math.random() - 0.5) * 0.4, 1.6 + Math.random() * 0.3, (Math.random() - 0.5) * 0.4);
      fountain.add(spray);
      this.fountains.push(spray);
    }

    this.scene.add(fountain);
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

      this.scene.add(tree);
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

      this.scene.add(tree);
    };

    const treeCoords = [
      [-14, -12, 1.3, greenMat], [-12, -16, 1.1, limeMat], [-16, -8, 1.2, pineMat],
      [14, -12, 1.3, orangeMat], [16, -8, 1.1, greenMat], [12, -15, 1.2, limeMat],
      [-14, 12, 1.2, limeMat], [-16, 8, 1.3, pineMat], [-12, 15, 1.1, greenMat],
      [14, 12, 1.2, greenMat], [16, 8, 1.3, orangeMat], [12, 15, 1.1, pineMat],
      [-4.5, -4.5, 0.95, limeMat], [4.5, -9.0, 1.0, orangeMat], [-3.5, 10.5, 1.05, greenMat],
    ];

    treeCoords.forEach(([x, z, s, mat]) => {
      if (mat === pineMat) {
        createPineTree(x, z, s);
      } else {
        createFluffyTree(x, z, s, mat);
      }
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

      this.scene.add(bed);
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

      this.scene.add(lamp);
    };

    createStreetLamp(1.6, -8.0);
    createStreetLamp(-1.6, 8.0);
    createStreetLamp(-4.0, 1.8);
    createStreetLamp(4.0, -1.8);
  }

  update(dt, elapsed) {
    this.fountains.forEach((spray, idx) => {
      spray.position.y = 1.6 + Math.sin(elapsed * 6 + idx * 1.5) * 0.18;
    });

    this.waterMeshes.forEach((water) => {
      water.position.y = 0.08 + Math.sin(elapsed * 2.0) * 0.01;
    });
  }
}
