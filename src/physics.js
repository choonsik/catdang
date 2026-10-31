import * as THREE from 'three';

// 초경량 2.5D 충돌 감지 & 지형 높이맵 엔진
export class PhysicsEngine {
  constructor() {
    this.currentWorld = null;
    this.colliders = [];
  }

  // 월드 전환 시 해당 월드의 충돌체 및 지형 바인딩
  setWorld(worldInstance) {
    this.currentWorld = worldInstance;
    this.colliders = (worldInstance && worldInstance.colliders) ? worldInstance.colliders : [];
  }

  // 지형 높이맵
  getHeightAt(x, z, currentY = 0) {
    if (this.currentWorld && typeof this.currentWorld.getHeightAt === 'function') {
      return this.currentWorld.getHeightAt(x, z, currentY);
    }
    return 0;
  }

  // 지형 경사각 (다리 등)
  getPitchAt(x, z) {
    if (this.currentWorld && typeof this.currentWorld.getPitchAt === 'function') {
      return this.currentWorld.getPitchAt(x, z);
    }
    return 0;
  }

  // 물 영역 판정
  isInsideWater(x, z) {
    if (this.currentWorld && typeof this.currentWorld.isInsideWater === 'function') {
      return this.currentWorld.isInsideWater(x, z);
    }
    return false;
  }

  // 충돌 검사
  isColliding(x, z, radius = 0.25, currentY = 0) {
    // 1. 월드별 자체 커스텀 경계/낙하 차단 검사 (예: 하늘 천공섬 바깥 낭떠러지)
    if (this.currentWorld && typeof this.currentWorld.isColliding === 'function') {
      if (this.currentWorld.isColliding(x, z, radius, currentY)) return true;
    }

    // 2. 월드 맵 기본 사각 경계
    if (x < -26 || x > 26 || z < -26 || z > 26) return true;

    // 3. 수역(연못/바다/온천 등) 진입 차단 (다리/튜브 위는 제외됨)
    if (this.isInsideWater(x, z)) return true;

    // 사물 콜라이더
    for (let i = 0; i < this.colliders.length; i++) {
      const col = this.colliders[i];
      // 물체의 윗면(topY)이 정의되어 있고, 고양이가 그 윗면 높이 근처나 그 위에 있다면 통과(올라섬) 허용!
      if (col.topY !== undefined && currentY >= col.topY - 0.12) {
        continue;
      }
      if (col.type === 'circle') {
        const distSq = (x - col.x) * (x - col.x) + (z - col.z) * (z - col.z);
        const minDist = col.radius + radius;
        if (distSq < minDist * minDist) return true;
      } else if (col.type === 'box') {
        if (
          x >= col.minX - radius &&
          x <= col.maxX + radius &&
          z >= col.minZ - radius &&
          z <= col.maxZ + radius
        ) {
          return true;
        }
      }
    }
    return false;
  }

  // 슬라이딩 충돌 해결 (장애물에 닿았을 때 미끄러지듯 자연스럽게 이동)
  resolveMovement(currentPos, deltaMove, catRadius = 0.26, currentY = 0) {
    const nextX = currentPos.x + deltaMove.x;
    const nextZ = currentPos.z + deltaMove.z;

    // 대각선 이동 가능 여부
    if (!this.isColliding(nextX, nextZ, catRadius, currentY)) {
      return { x: nextX, z: nextZ };
    }

    // X축 단독 미끄러짐
    if (!this.isColliding(nextX, currentPos.z, catRadius, currentY)) {
      return { x: nextX, z: currentPos.z };
    }

    // Z축 단독 미끄러짐
    if (!this.isColliding(currentPos.x, nextZ, catRadius, currentY)) {
      return { x: currentPos.x, z: nextZ };
    }

    // 이동 불가 시 제자리
    return { x: currentPos.x, z: currentPos.z };
  }
}

export const physics = new PhysicsEngine();
