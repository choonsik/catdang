import Peer from 'peerjs';
import { CatCharacter } from './cat.js';
import { physics } from './physics.js';

export class NetworkManager {
  constructor(scene, localCat) {
    this.scene = scene;
    this.localCat = localCat;
    this.remoteCats = new Map();
    this.connections = new Map();
    this.peer = null;
    this.peerId = null;
    this.roomId = 'catdang-park-v2';
    this.broadcastInterval = null;

    this.onUserCountChange = null;
    this.waypoints = [
      [-2.5, 4.5], [0, 6.0], [0, 0], [4.0, 2.0], [6.0, 4.0],
      [0, -4.0], [-4.0, -2.0], [3.0, -8.0], [-2.0, -8.0],
      [6.0, -2.0], [-6.0, 0.0], [-1.0, 10.0], [2.0, 10.0],
      [-8.0, 5.0], [-12.0, 5.0],
    ];

    this._spawnAmbientCats();
  }

  // 월드 변경 시 자율 냥이들을 새 월드의 웨이포인트로 안전하게 이동
  setWorld(worldInstance) {
    if (worldInstance && Array.isArray(worldInstance.waypoints) && worldInstance.waypoints.length > 0) {
      this.waypoints = worldInstance.waypoints;
    }

    // 각 NPC 냥이를 새 월드의 웨이포인트 근처로 재배치
    this.ambientCats.forEach((npc, index) => {
      const wp = this.waypoints[index % this.waypoints.length] || [0, 0];
      const startX = wp[0] + (Math.random() - 0.5) * 1.5;
      const startZ = wp[1] + (Math.random() - 0.5) * 1.5;
      npc.position.set(startX, 0, startZ);
      npc.targetPosition.set(startX, 0, startZ);
      npc.setLoaf(false);
      if (npc.state === 'stretch') npc.toggleStretch();
    });
  }

  // ─── 공원을 활발하게 뛰어놀고 산책하는 자율 냥이들 ───
  _spawnAmbientCats() {
    this.ambientCats = [];

    // 개성 넘치는 5마리의 자율 고양이 스펙
    const npcs = [
      { name: '보리', breed: 'calico', start: [-2, 0, 4] },
      { name: '치즈', breed: 'cheese', start: [4, 0, -2] },
      { name: '까망', breed: 'black', start: [-6, 0, -6] },
      { name: '턱시', breed: 'tuxedo', start: [2, 0, -8] },
      { name: '나비', breed: 'calico', start: [6, 0, 4] },
    ];

    // 공원 내 주요 힐링 산책 포인트들 (장애물이 없는 안전한 스팟)
    const parkWaypoints = [
      [-2.5, 4.5], [0, 6.0], [0, 0], [4.0, 2.0], [6.0, 4.0],
      [0, -4.0], [-4.0, -2.0], [3.0, -8.0], [-2.0, -8.0],
      [6.0, -2.0], [-6.0, 0.0], [-1.0, 10.0], [2.0, 10.0],
      [-8.0, 5.0], // 다리 위 명당!
      [-12.0, 5.0], // 다리 건너 서쪽 숲!
    ];

    npcs.forEach((info) => {
      const npcCat = new CatCharacter(info.breed, info.name, true);
      npcCat.position.set(info.start[0], 0, info.start[1]);
      npcCat.targetPosition.set(info.start[0], 0, info.start[1]);
      this.scene.add(npcCat.group);

      // 자율 AI 메타데이터
      npcCat.ai = {
        timer: Math.random() * 2,
        actionState: 'walk', // walk, loaf, stretch, idle
        targetWaypoint: null,
      };

      this.ambientCats.push(npcCat);
    });

    // ─── 자율 고양이 AI 루프 (자주 걷고 탐험하기) ───
    setInterval(() => {
      this.ambientCats.forEach((npc) => {
        const rand = Math.random();

        // 70% 확률로 새로운 곳으로 활발하게 산책
        if (rand < 0.65) {
          npc.setLoaf(false);
          // 목적지 선택 (현재 월드 웨이포인트 중 하나 + 약간의 랜덤 오프셋)
          const wpList = this.waypoints || parkWaypoints;
          const wp = wpList[(Math.random() * wpList.length) | 0];
          const destX = wp[0] + (Math.random() - 0.5) * 2.5;
          const destZ = wp[1] + (Math.random() - 0.5) * 2.5;

          // 장애물이 아니면 목표로 설정
          if (!physics.isColliding(destX, destZ, 0.3)) {
            npc.targetPosition.set(destX, 0, destZ);
            npc.ai.actionState = 'walk';
          }
        } else if (rand < 0.8) {
          // 식빵 굽기
          npc.setLoaf(true);
          npc.ai.actionState = 'loaf';
        } else if (rand < 0.9) {
          // 기지개 켜기
          npc.toggleStretch();
          npc.ai.actionState = 'stretch';
          setTimeout(() => {
            if (npc.state === 'stretch') npc.toggleStretch();
          }, 2500);
        } else {
          // 야옹하고 말풍선 띄우기
          const meowPhrases = [
            '야옹~ 🐾', '날씨 좋다옹', '츄르 어디냥?',
            '사뿐사뿐~', '골골송 부르는 중', '나비 쫓는 중!'
          ];
          const phrase = meowPhrases[(Math.random() * meowPhrases.length) | 0];
          npc.showSpeech(phrase, true);
        }
      });
    }, 3800); // 3.8초마다 활기차게 다음 행동 결정
  }

  // WebRTC P2P 네트워크
  init(nickname, breed) {
    this.localCat.setNickname(nickname);

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    this.peerId = `catdang-${randomSuffix}`;

    try {
      this.peer = new Peer(this.peerId, { debug: 1 });

      this.peer.on('open', (id) => {
        this.peerId = id;
        this._registerToRoom();
        this._startBroadcasting();
      });

      this.peer.on('connection', (conn) => {
        this._setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('P2P 알림:', err);
      });
    } catch (e) {
      console.warn('WebRTC 초기화 실패, 로컬 모드로 동작합니다.', e);
    }
  }

  _registerToRoom() {
    const roomKey = `peers-${this.roomId}`;
    let peers = [];
    try {
      peers = JSON.parse(localStorage.getItem(roomKey) || '[]');
    } catch (e) {
      peers = [];
    }

    const now = Date.now();
    peers = peers.filter((p) => p.id !== this.peerId && now - p.time < 30000);

    peers.forEach((p) => {
      if (!this.connections.has(p.id)) {
        const conn = this.peer.connect(p.id, { reliable: true });
        this._setupConnection(conn);
      }
    });

    peers.push({ id: this.peerId, time: now });
    try {
      localStorage.setItem(roomKey, JSON.stringify(peers));
    } catch (e) {}

    setInterval(() => {
      try {
        let current = JSON.parse(localStorage.getItem(roomKey) || '[]');
        current = current.filter((p) => p.id !== this.peerId && Date.now() - p.time < 30000);
        current.push({ id: this.peerId, time: Date.now() });
        localStorage.setItem(roomKey, JSON.stringify(current));

        current.forEach((p) => {
          if (p.id !== this.peerId && !this.connections.has(p.id)) {
            const conn = this.peer.connect(p.id, { reliable: true });
            this._setupConnection(conn);
          }
        });
      } catch (e) {}
    }, 4000);

    window.addEventListener('beforeunload', () => {
      try {
        let current = JSON.parse(localStorage.getItem(roomKey) || '[]');
        current = current.filter((p) => p.id !== this.peerId);
        localStorage.setItem(roomKey, JSON.stringify(current));
      } catch (e) {}
    });
  }

  _setupConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this._updateUserCount();

      conn.send({
        type: 'sync',
        x: this.localCat.position.x,
        z: this.localCat.position.z,
        rotY: this.localCat.rotation.y,
        state: this.localCat.state,
        breed: this.localCat.breedKey,
        nickname: this.localCat.nickname,
      });
    });

    conn.on('data', (data) => {
      this._handleRemoteData(conn.peer, data);
    });

    conn.on('close', () => {
      this._removeRemoteCat(conn.peer);
      this.connections.delete(conn.peer);
      this._updateUserCount();
    });

    conn.on('error', () => {
      this._removeRemoteCat(conn.peer);
      this.connections.delete(conn.peer);
      this._updateUserCount();
    });
  }

  _handleRemoteData(peerId, data) {
    if (data.type === 'sync') {
      let rCat = this.remoteCats.get(peerId);
      if (!rCat) {
        rCat = new CatCharacter(data.breed || 'cheese', data.nickname || '친구냥', true);
        rCat.position.set(data.x, 0, data.z);
        rCat.targetPosition.set(data.x, 0, data.z);
        rCat.rotation.y = data.rotY || 0;
        this.scene.add(rCat.group);
        this.remoteCats.set(peerId, rCat);
      } else {
        rCat.targetPosition.set(data.x, 0, data.z);
        rCat.targetRotation = data.rotY || 0;
        if (data.nickname && rCat.nickname !== data.nickname) {
          rCat.setNickname(data.nickname);
        }
        if (data.state === 'loaf' && rCat.state !== 'loaf') {
          rCat.setLoaf(true);
        } else if (data.state !== 'loaf' && rCat.state === 'loaf') {
          rCat.setLoaf(false);
        }
      }
    } else if (data.type === 'chat') {
      const rCat = this.remoteCats.get(peerId);
      if (rCat) {
        rCat.showSpeech(data.text, data.isMeow);
      }
    }
  }

  _removeRemoteCat(peerId) {
    const rCat = this.remoteCats.get(peerId);
    if (rCat) {
      this.scene.remove(rCat.group);
      this.remoteCats.delete(peerId);
    }
  }

  _startBroadcasting() {
    this.broadcastInterval = setInterval(() => {
      if (this.connections.size === 0) return;
      const payload = {
        type: 'sync',
        x: this.localCat.position.x,
        z: this.localCat.position.z,
        rotY: this.localCat.rotation.y,
        state: this.localCat.state,
        breed: this.localCat.breedKey,
        nickname: this.localCat.nickname,
      };
      this.connections.forEach((conn) => {
        if (conn.open) conn.send(payload);
      });
    }, 100);
  }

  broadcastChat(text, isMeow = false) {
    const payload = { type: 'chat', text, isMeow };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(payload);
    });
  }

  _updateUserCount() {
    const total = 1 + this.connections.size + this.ambientCats.length;
    if (this.onUserCountChange) {
      this.onUserCountChange(total, 1 + this.connections.size);
    }
  }

  // 매 프레임 업데이트: 원격 및 자율 냥이들의 이동 & 회전 보간
  update(dt) {
    this.remoteCats.forEach((cat) => cat.update(dt, null));

    this.ambientCats.forEach((cat) => {
      // 자율 냥이가 목표점을 향해 걸어갈 때 회전각 자동 계산
      const dist = cat.position.distanceTo(cat.targetPosition);
      if (dist > 0.1 && cat.state !== 'loaf' && cat.state !== 'stretch') {
        const dirX = cat.targetPosition.x - cat.position.x;
        const dirZ = cat.targetPosition.z - cat.position.z;
        cat.targetRotation = Math.atan2(-dirZ, dirX);
      }
      cat.update(dt, null);
    });
  }
}
