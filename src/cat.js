import * as THREE from 'three';
import { soundscape } from './audio.js';
import { physics } from './physics.js';

export const CAT_BREEDS = {
  cheese: {
    name: '치즈냥',
    primary: 0xf59e0b,
    belly: 0xffedd5,
    earInside: 0xfca5a5,
    eye: 0x4d7c0f,
    nose: 0xf43f5e,
  },
  calico: {
    name: '삼색냥',
    primary: 0xffffff,
    belly: 0xf8fafc,
    patch1: 0xd97706,
    patch2: 0x1e293b,
    earInside: 0xfca5a5,
    eye: 0xd97706,
    nose: 0xf43f5e,
  },
  tuxedo: {
    name: '턱시도냥',
    primary: 0x1e293b,
    belly: 0xffffff,
    earInside: 0xfca5a5,
    eye: 0xeab308,
    nose: 0xf43f5e,
  },
  black: {
    name: '깜냥이',
    primary: 0x0f172a,
    belly: 0x1e293b,
    earInside: 0x475569,
    eye: 0x10b981,
    nose: 0x334155,
  },
};

export class CatCharacter {
  constructor(breedKey = 'cheese', nickname = '고양이', isRemote = false) {
    this.breedKey = breedKey;
    this.breed = CAT_BREEDS[breedKey] || CAT_BREEDS.cheese;
    this.nickname = nickname;
    this.isRemote = isRemote;

    this.group = new THREE.Group();

    // 상태 머신: idle, walk, loaf, stretch
    this.state = 'idle';
    this.animTime = Math.random() * 10;

    // 움직임 물리 & 속도
    this.position = this.group.position;
    this.rotation = this.group.rotation;
    this.targetPosition = this.position.clone();
    this.targetRotation = 0;
    this.speed = 0;
    this.moveSpeed = isRemote ? 2.6 : 4.8;
    this.stuckTime = 0; // 장애물에 막힌 시간 추적

    // 🐾 점프 물리 속성
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.jumpHeight = 0;
    this.landSquash = 1.0;

    this._buildMesh();
    this._buildNameTag();
    this._buildSpeechBubble();
  }

  _buildMesh() {
    this.matPrimary = new THREE.MeshLambertMaterial({ color: this.breed.primary });
    this.matBelly = new THREE.MeshLambertMaterial({ color: this.breed.belly });
    this.matEarInside = new THREE.MeshLambertMaterial({ color: this.breed.earInside });
    this.matEye = new THREE.MeshLambertMaterial({ color: this.breed.eye });
    this.matPupil = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.matNose = new THREE.MeshLambertMaterial({ color: this.breed.nose });

    // 1. 몸통 (전방 +X축)
    const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.46, 8, 12);
    bodyGeo.rotateZ(Math.PI / 2);
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.matPrimary);
    this.bodyMesh.position.y = 0.38;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    const bellyGeo = new THREE.CapsuleGeometry(0.23, 0.36, 8, 12);
    bellyGeo.rotateZ(Math.PI / 2);
    const bellyMesh = new THREE.Mesh(bellyGeo, this.matBelly);
    bellyMesh.position.set(0, -0.04, 0);
    this.bodyMesh.add(bellyMesh);

    // 2. 머리
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0.32, 0.5, 0);
    this.group.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.24, 12, 10);
    headGeo.scale(1.05, 0.95, 1.05);
    const headMesh = new THREE.Mesh(headGeo, this.matPrimary);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    const earGeo = new THREE.ConeGeometry(0.085, 0.15, 4);
    const earInGeo = new THREE.ConeGeometry(0.055, 0.12, 4);

    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(earGeo, this.matPrimary);
      ear.position.set(0.02, 0.22, side * 0.12);
      ear.rotation.set(side * 0.25, 0, -0.2);
      this.headGroup.add(ear);

      const earIn = new THREE.Mesh(earInGeo, this.matEarInside);
      earIn.position.set(0.01, -0.01, 0);
      ear.add(earIn);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this.matEye);
      eye.position.set(0.18, 0.04, side * 0.095);
      this.headGroup.add(eye);

      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.065, 0.022), this.matPupil);
      pupil.position.set(0.03, 0, 0);
      eye.add(pupil);
    });

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.032, 3), this.matNose);
    nose.rotation.z = Math.PI / 2;
    nose.position.set(0.24, 0.01, 0);
    this.headGroup.add(nose);

    // 3. 다리 4개
    const legGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.28, 8);
    this.legs = [];
    const legOffsets = [
      { x: 0.18, z: 0.13 },
      { x: 0.18, z: -0.13 },
      { x: -0.18, z: 0.13 },
      { x: -0.18, z: -0.13 },
    ];
    legOffsets.forEach((pos) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(pos.x, 0.3, pos.z);

      const legMesh = new THREE.Mesh(legGeo, this.matPrimary);
      legMesh.position.y = -0.14;
      legMesh.castShadow = true;
      legPivot.add(legMesh);

      const pawGeo = new THREE.SphereGeometry(0.058, 8, 6);
      pawGeo.scale(1.2, 0.6, 1.0);
      const pawMesh = new THREE.Mesh(pawGeo, this.matBelly);
      pawMesh.position.set(0.02, -0.27, 0);
      legPivot.add(pawMesh);

      this.group.add(legPivot);
      this.legs.push(legPivot);
    });

    // 4. 꼬리
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(-0.25, 0.42, 0);
    this.group.add(this.tailGroup);

    const tailGeo = new THREE.CylinderGeometry(0.038, 0.026, 0.38, 8);
    tailGeo.translate(0, 0.19, 0);
    this.tailMesh = new THREE.Mesh(tailGeo, this.matPrimary);
    this.tailMesh.rotation.x = -Math.PI / 5;
    this.tailGroup.add(this.tailMesh);
  }

  setBreed(breedKey) {
    this.breedKey = breedKey;
    this.breed = CAT_BREEDS[breedKey] || CAT_BREEDS.cheese;
    this.matPrimary.color.setHex(this.breed.primary);
    this.matBelly.color.setHex(this.breed.belly);
    this.matEarInside.color.setHex(this.breed.earInside);
    this.matEye.color.setHex(this.breed.eye);
    this.matNose.color.setHex(this.breed.nose);
  }

  _buildNameTag() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    this.nameCanvas = canvas;
    this.nameCtx = canvas.getContext('2d');
    this._renderNameTag();

    const tex = new THREE.CanvasTexture(canvas);
    this.nameTex = tex;

    const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    this.nameSprite = new THREE.Sprite(spriteMat);
    this.nameSprite.position.set(0, 1.25, 0);
    this.nameSprite.scale.set(1.4, 0.35, 1);
    this.group.add(this.nameSprite);
  }

  _renderNameTag() {
    const ctx = this.nameCtx;
    ctx.clearRect(0, 0, 256, 64);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(16, 12, 224, 40, 20);
    ctx.fill();

    ctx.font = 'bold 22px Gowun Dodum, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🐾 ${this.nickname}`, 128, 32);
  }

  setNickname(name) {
    this.nickname = name;
    this._renderNameTag();
    if (this.nameTex) this.nameTex.needsUpdate = true;
  }

  _buildSpeechBubble() {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 120;
    this.bubbleCanvas = canvas;
    this.bubbleCtx = canvas.getContext('2d');

    const tex = new THREE.CanvasTexture(canvas);
    this.bubbleTex = tex;

    const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, opacity: 0 });
    this.bubbleSprite = new THREE.Sprite(spriteMat);
    this.bubbleSprite.position.set(0, 1.85, 0);
    this.bubbleSprite.scale.set(1.8, 0.68, 1);
    this.group.add(this.bubbleSprite);

    this.bubbleTimer = null;
  }

  showSpeech(text, isMeow = false) {
    if (isMeow) soundscape.playMeow();

    const ctx = this.bubbleCtx;
    ctx.clearRect(0, 0, 320, 120);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(10, 10, 300, 80, 16);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(150, 90);
    ctx.lineTo(160, 110);
    ctx.lineTo(170, 90);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 22px Gowun Dodum, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const display = text.length > 14 ? text.slice(0, 13) + '…' : text;
    ctx.fillText(display, 160, 50);

    this.bubbleTex.needsUpdate = true;
    this.bubbleSprite.material.opacity = 1;

    clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(() => {
      this.bubbleSprite.material.opacity = 0;
    }, 3500);
  }

  meow() {
    this.showSpeech('야옹~ 🐾', true);
    this.headGroup.rotation.z = 0.3;
    setTimeout(() => {
      this.headGroup.rotation.z = 0;
    }, 450);
  }

  // 🐾 폴짝 점프 액션!
  jump() {
    if (this.state === 'loaf' || this.state === 'stretch') {
      this.setLoaf(false);
      this.state = 'idle';
    }

    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = 6.2; // 1.4m 체공 점프력
      this.showSpeech('폴짝! 🐾', true);
      if (!this.isRemote) {
        soundscape.playJump();
      }
    }
  }

  setLoaf(enable) {
    if (enable) {
      this.state = 'loaf';
      if (!this.isRemote) soundscape.setLoafMode(true);
    } else if (this.state === 'loaf') {
      this.state = 'idle';
      if (!this.isRemote) soundscape.setLoafMode(false);
    }
  }

  toggleStretch() {
    this.state = this.state === 'stretch' ? 'idle' : 'stretch';
    this.animTime = 0;
  }

  update(dt, inputDir = null) {
    this.animTime += dt;

    if (inputDir && (inputDir.x !== 0 || inputDir.z !== 0)) {
      // 1. 플레이어 직접 조작
      if (this.state === 'loaf' || this.state === 'stretch') {
        this.setLoaf(false);
        this.state = 'idle';
      }
      this.state = 'walk';

      this.targetRotation = Math.atan2(-inputDir.z, inputDir.x);

      let diff = this.targetRotation - this.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotation.y += diff * Math.min(1, dt * 15);

      // 플레이어 충돌 해결 (현재 고양이 높이 전달하여 캣타워 발판/소파 위를 자연스럽게 밟을 수 있게 지원)
      const deltaMove = {
        x: inputDir.x * this.moveSpeed * dt,
        z: inputDir.z * this.moveSpeed * dt,
      };
      const resolved = physics.resolveMovement(this.position, deltaMove, 0.28, this.position.y);
      this.position.x = resolved.x;
      this.position.z = resolved.z;

      this.targetPosition.copy(this.position);
      this.speed = this.moveSpeed;
    } else if (this.isRemote) {
      // 2. 🌟 자율 냥이 및 원격 고양이도 물리엔진(충돌/다리 높이맵) 100% 적용!
      const dist = Math.hypot(this.targetPosition.x - this.position.x, this.targetPosition.z - this.position.z);

      if (dist > 0.08 && this.state !== 'loaf' && this.state !== 'stretch') {
        this.state = 'walk';

        const step = this.moveSpeed * dt;
        const moveDist = Math.min(step, dist);
        const dirX = (this.targetPosition.x - this.position.x) / dist;
        const dirZ = (this.targetPosition.z - this.position.z) / dist;

        // 🌟 자율 고양이도 physics.resolveMovement를 거쳐 장애물/물가를 뚫지 못하도록 차단!
        const deltaMove = {
          x: dirX * moveDist,
          z: dirZ * moveDist,
        };
        const prevX = this.position.x;
        const prevZ = this.position.z;

        const resolved = physics.resolveMovement(this.position, deltaMove, 0.28, this.position.y);
        this.position.x = resolved.x;
        this.position.z = resolved.z;

        // 벽이나 물에 막혀서 거의 전진하지 못했으면 막힘 감지
        const actualMoved = Math.hypot(this.position.x - prevX, this.position.z - prevZ);
        if (actualMoved < 0.001) {
          this.stuckTime += dt;
          if (this.stuckTime > 1.2) {
            // 벽에 낀 경우 목표점을 현재 위치로 리셋 (다른 곳으로 가게 유도)
            this.targetPosition.copy(this.position);
            this.state = 'idle';
            this.stuckTime = 0;
          }
        } else {
          this.stuckTime = 0;
        }

        // 진행 방향을 향해 부드럽게 회전
        this.targetRotation = Math.atan2(-dirZ, dirX);
        let diff = this.targetRotation - this.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotation.y += diff * Math.min(1, dt * 10);
      } else {
        if (this.state === 'walk') this.state = 'idle';
      }
    } else {
      this.targetPosition.copy(this.position);
      if (this.state === 'walk') this.state = 'idle';
    }

    // 🌟 점프 물리 처리 (중력 및 체공 포물선 계산)
    if (this.isJumping) {
      this.jumpVelocity -= 18.0 * dt; // 중력 가속도
      this.jumpHeight += this.jumpVelocity * dt;

      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.isJumping = false;
        this.landSquash = 0.72; // 착지 시 스쿼시 충격 흡수 탄성
        if (!this.isRemote) {
          soundscape.playLand();
        }
      }
    }

    // 착지 후 몸통 탄성 복원
    if (this.landSquash < 1.0) {
      this.landSquash = Math.min(1.0, this.landSquash + dt * 4.5);
    }

    // 🌟 모든 고양이(자율 냥이 포함)가 다리 위 또는 캣타워 발판 위로 올라가면 Y 높이가 위로 올라가도록 높이맵 적용 + 점프 높이 합성!
    const currentBaseY = Math.max(0, this.position.y - this.jumpHeight);
    const effectiveY = this.isJumping ? this.position.y : currentBaseY;
    const groundY = physics.getHeightAt(this.position.x, this.position.z, effectiveY);
    this.position.y = THREE.MathUtils.lerp(currentBaseY, groundY, dt * 14) + this.jumpHeight;

    // 점프 중 특수 공중 모션
    if (this.isJumping) {
      // 앞다리는 앞으로 뻗고, 뒷다리는 뒤로 접힘
      this.legs[0].rotation.z = -0.55;
      this.legs[1].rotation.z = -0.55;
      this.legs[2].rotation.z = 0.55;
      this.legs[3].rotation.z = 0.55;

      this.bodyMesh.rotation.z = 0.15;
      this.bodyMesh.scale.set(1.12, 0.9, 0.9);
      this.headGroup.position.y = 0.52;
      this.tailGroup.rotation.z = 0.65;
    } else {
      this.bodyMesh.scale.set(1.0, this.landSquash, 1.0);
    }

    // 걷기 다리 애니메이션 (점프 중이 아닐 때만)
    if (!this.isJumping && this.state === 'walk') {
      const stepSpeed = this.isRemote ? 9 : 13;
      const legAngle = Math.sin(this.animTime * stepSpeed) * 0.45;
      this.legs[0].rotation.z = -legAngle;
      this.legs[1].rotation.z = legAngle;
      this.legs[2].rotation.z = legAngle;
      this.legs[3].rotation.z = -legAngle;

      this.bodyMesh.position.y = 0.38 + Math.abs(Math.sin(this.animTime * stepSpeed)) * 0.03;
      this.headGroup.position.y = 0.5 + Math.abs(Math.sin(this.animTime * stepSpeed)) * 0.02;

      this.tailGroup.rotation.y = Math.sin(this.animTime * 6) * 0.3;
      this.tailGroup.rotation.z = 0.2 + Math.cos(this.animTime * 6) * 0.15;
    } else if (!this.isJumping && this.state === 'loaf') {
      this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.22, dt * 6);
      this.headGroup.position.y = THREE.MathUtils.lerp(this.headGroup.position.y, 0.34, dt * 6);
      this.legs.forEach((l) => {
        l.position.y = THREE.MathUtils.lerp(l.position.y, 0.15, dt * 6);
        l.rotation.z = 0;
      });
      this.tailGroup.rotation.y = THREE.MathUtils.lerp(this.tailGroup.rotation.y, 1.1, dt * 4);
      this.tailGroup.rotation.z = THREE.MathUtils.lerp(this.tailGroup.rotation.z, -0.4, dt * 4);
    } else if (this.state === 'stretch') {
      this.bodyMesh.position.y = 0.32;
      this.bodyMesh.rotation.z = -0.3;
      this.legs[0].rotation.z = 0.5;
      this.legs[1].rotation.z = 0.5;
      this.legs[2].rotation.z = -0.4;
      this.legs[3].rotation.z = -0.4;
      this.tailGroup.rotation.z = 0.6;
    } else {
      this.bodyMesh.rotation.z = 0;
      this.bodyMesh.position.y = THREE.MathUtils.lerp(this.bodyMesh.position.y, 0.38, dt * 6);
      this.headGroup.position.y = THREE.MathUtils.lerp(this.headGroup.position.y, 0.5, dt * 6);
      this.legs.forEach((l) => {
        l.position.y = THREE.MathUtils.lerp(l.position.y, 0.3, dt * 6);
        l.rotation.z = 0;
      });
      this.tailGroup.rotation.y = Math.sin(this.animTime * 2.5) * 0.35;
      this.tailGroup.rotation.z = 0.2 + Math.cos(this.animTime * 2.5) * 0.1;
    }
  }
}
