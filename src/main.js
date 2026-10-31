import * as THREE from 'three';
import { soundscape } from './audio.js';
import { CatCharacter } from './cat.js';
import { WORLD_DEFINITIONS, createWorld } from './worlds/index.js';
import { NetworkManager } from './network.js';
import { physics } from './physics.js';

// ─── 1. 듀얼 카메라 (아이소메트릭 Ortho & 다이내믹 Perspective) ───
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

let zoomLevel = 6.8;
let aspect = window.innerWidth / window.innerHeight;

// (1) 친숙한 2.5D 아이소메트릭 정사영 카메라
const orthoCamera = new THREE.OrthographicCamera(
  -zoomLevel * aspect,
  zoomLevel * aspect,
  zoomLevel,
  -zoomLevel,
  0.1,
  1000
);

// (2) 애니메이션/SF 메카닉 전용 3D 원근 투영 카메라
const perspCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

let activeCamera = orthoCamera;
let currentCameraOffset = new THREE.Vector3(24, 24, 24);
let currentCameraLookOffset = new THREE.Vector3(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

function updateCameraFrustum() {
  aspect = window.innerWidth / window.innerHeight;
  orthoCamera.left = -zoomLevel * aspect;
  orthoCamera.right = zoomLevel * aspect;
  orthoCamera.top = zoomLevel;
  orthoCamera.bottom = -zoomLevel;
  orthoCamera.updateProjectionMatrix();

  perspCamera.aspect = aspect;
  perspCamera.updateProjectionMatrix();
}

window.addEventListener('resize', () => {
  updateCameraFrustum();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 마우스 휠 줌인/줌아웃 (카메라 타입에 맞춰 자연스럽게 반응)
window.addEventListener('wheel', (e) => {
  if (activeCamera === orthoCamera) {
    zoomLevel = Math.max(3.8, Math.min(13.0, zoomLevel + e.deltaY * 0.005));
    updateCameraFrustum();
  } else {
    // 원근 카메라: 거리 확대/축소
    const scale = e.deltaY > 0 ? 1.05 : 0.95;
    currentCameraOffset.multiplyScalar(scale);
    currentCameraOffset.clampLength(8, 38);
  }
});

function applyWorldCamera(targetWorld) {
  if (targetWorld && targetWorld.cameraConfig && targetWorld.cameraConfig.type === 'perspective') {
    activeCamera = perspCamera;
    perspCamera.fov = targetWorld.cameraConfig.fov || 50;
    perspCamera.aspect = window.innerWidth / window.innerHeight;
    perspCamera.updateProjectionMatrix();

    const off = targetWorld.cameraConfig.offset || [16, 12, 16];
    currentCameraOffset.set(off[0], off[1], off[2]);

    const lOff = targetWorld.cameraConfig.lookOffset || [0, 0, 0];
    currentCameraLookOffset.set(lOff[0], lOff[1], lOff[2]);
  } else {
    activeCamera = orthoCamera;
    updateCameraFrustum();
    currentCameraOffset.set(24, 24, 24);
    currentCameraLookOffset.set(0, 0, 0);
  }
}

// ─── 2. 초기 월드 & 고양이 & 멀티플레이어 생성 ───
let currentWorldId = 'park';
let world = createWorld('park', scene);
scene.add(world.group);
scene.background = new THREE.Color(world.background || 0xe0f2fe);
physics.setWorld(world);
applyWorldCamera(world);

let currentBreed = 'cheese';
let userNickname = '초보냥';

const localCat = new CatCharacter(currentBreed, userNickname, false);
localCat.position.set(world.spawnPoint[0] || 0, 0, world.spawnPoint[1] || 0);
scene.add(localCat.group);

const network = new NetworkManager(scene, localCat);
network.setWorld(world);

// ─── 3. 카메라 추적 & 마우스 인터랙션 ───
let cameraTarget = new THREE.Vector3(0, 0, 0);
let isZenMode = false;
let isPanning = false;
let startPan = { x: 0, y: 0 };
let downPos = { x: 0, y: 0 };
let currentPanOffset = new THREE.Vector3(0, 0, 0);

// 클릭 이동 (Raycaster)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let clickTarget = null;

window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.hud-top, .hud-bottom, .intro-card, .touch-controls, .world-modal-card')) return;
  isPanning = true;
  startPan = { x: e.clientX, y: e.clientY };
  downPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointermove', (e) => {
  if (!isPanning) return;
  const dx = e.clientX - startPan.x;
  const dy = e.clientY - startPan.y;
  startPan = { x: e.clientX, y: e.clientY };

  const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(activeCamera.quaternion);
  camRight.y = 0;
  camRight.normalize();

  const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(activeCamera.quaternion);
  camUp.y = 0;
  camUp.normalize();

  const factor = activeCamera === orthoCamera ? 0.026 : 0.035;
  currentPanOffset.addScaledVector(camRight, -dx * factor);
  currentPanOffset.addScaledVector(camUp, dy * factor);
});

window.addEventListener('pointerup', (e) => {
  if (!isPanning) return;
  isPanning = false;

  const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  if (dist < 6) {
    if (e.target.closest('.hud-top, .hud-bottom, .intro-card, .touch-controls, .world-modal-card')) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, activeCamera);

    const intersect = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floorPlane, intersect)) {
      if (!physics.isColliding(intersect.x, intersect.z, 0.2)) {
        clickTarget = intersect;
        localCat.setLoaf(false);
      }
    }
  }
});

// ─── 4. 키보드 & 터치 입력 ───
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
const touchDir = { x: 0, z: 0 };

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key in keys) keys[e.key] = true;
  if (e.code === 'Space') {
    e.preventDefault();
    localCat.jump();
  }
  if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    triggerMeow();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

// 모바일 가상 조이스틱
const stick = document.getElementById('virtual-stick');
const knob = document.getElementById('stick-knob');
let stickTouchId = null;
let stickCenter = { x: 0, y: 0 };

if (stick) {
  stick.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    stickTouchId = touch.identifier;
    const rect = stick.getBoundingClientRect();
    stickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  window.addEventListener('touchmove', (e) => {
    if (stickTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === stickTouchId) {
        const dx = touch.clientX - stickCenter.x;
        const dy = touch.clientY - stickCenter.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = 32;
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, maxDist);

        const cx = Math.cos(angle) * clampedDist;
        const cy = Math.sin(angle) * clampedDist;
        knob.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;

        touchDir.x = cx / maxDist;
        touchDir.z = cy / maxDist;
        clickTarget = null;
      }
    }
  }, { passive: false });

  const resetStick = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === stickTouchId) {
        stickTouchId = null;
        knob.style.transform = 'translate(-50%, -50%)';
        touchDir.x = 0;
        touchDir.z = 0;
      }
    }
  };
  window.addEventListener('touchend', resetStick);
  window.addEventListener('touchcancel', resetStick);
}

// ─── 5. 월드 전환 시스템 (World Manager) ───
const fadeVeil = document.getElementById('world-fade-veil');
const worldModal = document.getElementById('world-modal');
const worldGrid = document.getElementById('world-grid');
const btnWorldSelect = document.getElementById('btn-world-select');
const btnCloseWorldModal = document.getElementById('btn-close-world-modal');
const worldModalBackdrop = document.getElementById('world-modal-backdrop');
const currentWorldIconEl = document.getElementById('current-world-icon');
const currentWorldNameEl = document.getElementById('current-world-name');

let isSwitchingWorld = false;

function renderWorldGrid() {
  worldGrid.innerHTML = '';
  WORLD_DEFINITIONS.forEach((def) => {
    const card = document.createElement('div');
    const isCurrent = def.id === currentWorldId;
    card.className = `world-card ${isCurrent ? 'active' : ''}`;
    card.dataset.id = def.id;

    card.innerHTML = `
      <div class="world-card-top">
        <span class="world-card-icon">${def.icon}</span>
        <span class="world-card-tag">${def.tag}</span>
      </div>
      <div class="world-card-name">${def.name}</div>
      <div class="world-card-desc">${def.desc}</div>
      ${isCurrent ? '<div class="world-card-status">📍 지금 머무는 중</div>' : ''}
    `;

    card.addEventListener('click', () => {
      closeWorldModal();
      if (def.id !== currentWorldId) {
        switchWorld(def.id);
      }
    });

    worldGrid.appendChild(card);
  });
}

function openWorldModal() {
  renderWorldGrid();
  worldModal.classList.remove('hidden');
}

function closeWorldModal() {
  worldModal.classList.add('hidden');
}

btnWorldSelect.addEventListener('click', openWorldModal);
btnCloseWorldModal.addEventListener('click', closeWorldModal);
worldModalBackdrop.addEventListener('click', closeWorldModal);

function switchWorld(targetWorldId) {
  if (isSwitchingWorld) return;
  isSwitchingWorld = true;

  // 1. 암전 페이드 아웃
  fadeVeil.classList.add('active');

  setTimeout(() => {
    try {
      // 2. 기존 월드 제거 & 정리
      if (world) {
        scene.remove(world.group);
        if (typeof world.destroy === 'function') {
          world.destroy();
        }
      }

      // 3. 새 월드 인스턴스 생성 & 씬 추가
      currentWorldId = targetWorldId;
      world = createWorld(targetWorldId, scene);
      scene.add(world.group);

      if (world.background !== undefined) {
        scene.background = new THREE.Color(world.background);
      }

      // 4. 물리엔진 및 카메라 설정 적용
      physics.setWorld(world);
      network.setWorld(world);
      applyWorldCamera(world);

      // 5. 플레이어 리스폰 (새 월드의 스폰 포인트로 안전하게 이동)
      const spawnX = (world.spawnPoint && world.spawnPoint[0]) || 0;
      const spawnZ = (world.spawnPoint && world.spawnPoint[1]) || 0;
      localCat.position.set(spawnX, 0, spawnZ);
      localCat.targetPosition.set(spawnX, 0, spawnZ);
      localCat.setLoaf(false);
      if (localCat.state === 'stretch') localCat.toggleStretch();

      currentPanOffset.set(0, 0, 0);
      clickTarget = null;

      // 6. UI 헤더 갱신
      const curDef = WORLD_DEFINITIONS.find((w) => w.id === targetWorldId);
      if (curDef) {
        currentWorldIconEl.textContent = curDef.icon;
        currentWorldNameEl.textContent = curDef.name;
      }
    } catch (err) {
      console.error('월드 전환 중 오류 발생:', err);
    } finally {
      // 7. 암전 페이드 인
      setTimeout(() => {
        fadeVeil.classList.remove('active');
        isSwitchingWorld = false;
      }, 100);
    }
  }, 320);
}

// ─── 6. UI 및 네트워크 연동 ───
const introOverlay = document.getElementById('intro-overlay');
const btnEnter = document.getElementById('btn-enter');
const nicknameInput = document.getElementById('nickname-input');
const onlineCounter = document.getElementById('online-counter');

document.querySelectorAll('.breed-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.breed-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentBreed = btn.dataset.breed;
    localCat.setBreed(currentBreed);
  });
});

btnEnter.addEventListener('click', () => {
  const nick = nicknameInput.value.trim() || '야옹이';
  userNickname = nick;

  localCat.setNickname(userNickname);
  localCat.setBreed(currentBreed);

  soundscape.init();
  soundscape.toggleSound(true);
  updateSoundButtonUI(true);

  network.init(userNickname, currentBreed);
  introOverlay.classList.add('hidden');
});

network.onUserCountChange = (totalCats, realUsers) => {
  onlineCounter.textContent = `🐾 고양이 ${totalCats}마리 노는 중 (접속자 ${realUsers}명)`;
};

const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  localCat.showSpeech(text, false);
  network.broadcastChat(text, false);
  chatInput.value = '';
}

btnSendChat.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendChatMessage();
  }
});

const actJump = document.getElementById('btn-action-jump');
if (actJump) {
  actJump.addEventListener('click', () => {
    localCat.jump();
  });
}

function triggerMeow() {
  localCat.meow();
  network.broadcastChat('야옹~ 🐾', true);
}
document.getElementById('btn-action-meow').addEventListener('click', triggerMeow);

const actLoaf = document.getElementById('btn-action-loaf');
actLoaf.addEventListener('click', () => {
  const isLoaf = localCat.state === 'loaf';
  localCat.setLoaf(!isLoaf);
  actLoaf.classList.toggle('active', !isLoaf);
  clickTarget = null;
});

const actStretch = document.getElementById('btn-action-stretch');
actStretch.addEventListener('click', () => {
  localCat.toggleStretch();
  actStretch.classList.toggle('active', localCat.state === 'stretch');
});

const actZen = document.getElementById('btn-action-zen');
const zenBtnText = document.getElementById('zen-btn-text');
actZen.addEventListener('click', () => {
  isZenMode = !isZenMode;
  actZen.classList.toggle('active', isZenMode);
  zenBtnText.textContent = isZenMode ? '산책 모드' : '멍때리기';
  if (isZenMode) {
    localCat.setLoaf(true);
    actLoaf.classList.add('active');
  }
});

document.getElementById('btn-focus-cat').addEventListener('click', () => {
  currentPanOffset.set(0, 0, 0);
  clickTarget = null;
});

const btnSound = document.getElementById('btn-sound-toggle');
function updateSoundButtonUI(isPlaying) {
  btnSound.innerHTML = isPlaying ? '🔊 <span class="btn-label">소리 끄기</span>' : '🔇 <span class="btn-label">소리 켜기</span>';
}
btnSound.addEventListener('click', () => {
  soundscape.init();
  const newState = !soundscape.isMuted;
  soundscape.toggleSound(!newState);
  updateSoundButtonUI(!newState);
});

// ─── 7. 메인 렌더 루프 ───
let prevTime = performance.now();
let zenAngle = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const dt = Math.min((currentTime - prevTime) / 1000, 0.1);
  prevTime = currentTime;
  const elapsed = currentTime / 1000;

  if (world && typeof world.update === 'function') {
    world.update(dt, elapsed);
  }
  network.update(dt);

  // 로컬 조작 입력: 화면 기준 직관적 상하좌우 매핑 (활성 카메라 쿼터니언 기반)
  let input = { x: 0, z: 0 };
  if (keys.d || keys.ArrowRight) input.x += 1;
  if (keys.a || keys.ArrowLeft) input.x -= 1;
  if (keys.w || keys.ArrowUp) input.z -= 1;
  if (keys.s || keys.ArrowDown) input.z += 1;

  input.x += touchDir.x;
  input.z += touchDir.z;

  let moveDir = null;

  if (Math.hypot(input.x, input.z) > 0.05) {
    clickTarget = null;

    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(activeCamera.quaternion);
    camRight.y = 0;
    camRight.normalize();

    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(activeCamera.quaternion);
    camUp.y = 0;
    camUp.normalize();

    moveDir = new THREE.Vector3()
      .addScaledVector(camRight, input.x)
      .addScaledVector(camUp, -input.z)
      .normalize();
  } else if (clickTarget) {
    const toTarget = new THREE.Vector3().subVectors(clickTarget, localCat.position);
    toTarget.y = 0;
    if (toTarget.length() > 0.3) {
      moveDir = toTarget.normalize();
    } else {
      clickTarget = null;
    }
  }

  if (world && world.isCatRiding) {
    moveDir = null;
    clickTarget = null;
  }

  localCat.update(dt, moveDir);

  // 카메라 추적 (월드별 맞춤 카메라 위치 & 룩앳 적용)
  if (isZenMode) {
    zenAngle += dt * 0.05;
    const center = new THREE.Vector3(Math.sin(zenAngle) * 3.0, 0, Math.cos(zenAngle) * 3.0);
    activeCamera.position.set(center.x + currentCameraOffset.x, currentCameraOffset.y, center.z + currentCameraOffset.z);
    activeCamera.lookAt(center.clone().add(currentCameraLookOffset));
  } else {
    const target = localCat.position.clone().add(currentPanOffset);
    cameraTarget.lerp(target, dt * 6);

    const desiredCamPos = cameraTarget.clone().add(currentCameraOffset);
    activeCamera.position.copy(desiredCamPos);
    activeCamera.lookAt(cameraTarget.clone().add(currentCameraLookOffset));
  }

  renderer.render(scene, activeCamera);
}

requestAnimationFrame(animate);
