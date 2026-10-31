import { ParkWorld } from './park.js';
import { PixelWorld } from './pixel.js';
import { SkyWorld } from './sky.js';
import { AtticWorld } from './attic.js';

export const WORLD_DEFINITIONS = [
  {
    id: 'park',
    name: '평화 공원',
    icon: '🌳',
    tag: '오리지널 2.5D',
    desc: '아치 다리와 연못, 황금 고양이 분수대와 벚꽃이 어우러진 평화로운 정원',
    factory: (scene) => new ParkWorld(scene)
  },
  {
    id: 'pixel',
    name: '레트로 도트 마을',
    icon: '👾',
    tag: '8-bit Pixel',
    desc: '아기자기한 8비트 게임 속 픽셀 타일과 옹기종기 미니 가옥',
    factory: (scene) => new PixelWorld(scene)
  },
  {
    id: 'sky',
    name: '하늘을 나는 고양이',
    icon: '🕊️',
    tag: 'Flying Realm',
    desc: '솜사탕 구름과 무지개 다리를 건너 천사 날개 냥이들과 함께 나는 세상',
    factory: (scene) => new SkyWorld(scene)
  },
  {
    id: 'attic',
    name: '포근 다락방 찻집',
    icon: '🪵',
    tag: 'Cozy Attic',
    desc: '벽난로와 찻상, 남쪽 루프탑 테라스 너머 푸른 하늘이 열린 다락방',
    factory: (scene) => new AtticWorld(scene)
  }
];

export function createWorld(id, scene) {
  const def = WORLD_DEFINITIONS.find((w) => w.id === id);
  if (!def) {
    console.warn(`World id "${id}" not found. Falling back to park.`);
    return new ParkWorld(scene);
  }
  return def.factory(scene);
}
