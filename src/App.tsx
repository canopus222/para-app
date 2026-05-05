import { useState, useEffect } from 'react'
import './App.css'

// ぱらちゃんのデータの形を定義
interface Parachan {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stage: number; // 世代（1=最大、2=中、3=最小）
  isFood?: boolean; // 食べ物かどうかを判定するフラグ（?は「なくても良い」という意味）
  icon: string;     // 表示する中身（(・ω・) や 🍎）
  hasDroppedFood?: boolean; // すでに食べ物を出したかどうかの記録
  isEating?: boolean;   // もぐもぐ中かどうか
  eatTimer?: number;    // もぐもぐが終わるまでの時間
  isDropping?: boolean; // ドロップ中（まだ食べられない）フラグ
  munchText?: string;   // もぐもぐ中のセリフを保存する
}

function App() {
  const STAGE_WIDTH = 800;
  const STAGE_HEIGHT = 600;
  const BASE_PARA_SIZE = 60; 
  const MAX_STAGE = 4; // 第3世代（4匹）までで分裂を止める設定

  const [paras, setParas] = useState<Parachan[]>([
    { id: Date.now(), x: 370, y: 270, vx: 0.6, vy: 0.6, stage: 1, icon: '(・ω・)'}
  ]);

  // 食べ物をかぞえるための変数
  const [eatCount, setEatCount] = useState(0);

useEffect(() => {
    let animationFrameId: number;

    const move = () => {
      setParas((currentParas) => {
        const foods = currentParas.filter(p => p.isFood);

        // --- 1. まずは全員の移動を計算 ---
        const movedParas = currentParas.map((p) => {
          if (p.isEating && p.eatTimer && p.eatTimer > 0) {
            return { ...p, vx: 0, vy: 0, eatTimer: p.eatTimer - 1 };
          }
          if (p.isEating && p.eatTimer === 0) {
            return { ...p, isEating: false, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, icon: '(・ω・)' };
          }

          if (!p.isFood && !p.isEating) {
            const pSize = BASE_PARA_SIZE * Math.pow(0.85, p.stage - 1);
            const collidedFood = foods.find(f => {
              if (f.isDropping) return false; 
              const fSize = BASE_PARA_SIZE * Math.pow(0.85, f.stage - 1);
              const dx = (p.x + pSize / 2) - (f.x + fSize / 2);
              const dy = (p.y + pSize / 2) - (f.y + fSize / 2);
              return Math.sqrt(dx * dx + dy * dy) < (pSize + fSize) / 3;
            });

            if (collidedFood) {
              const phrases = ['ばりうま', 'うまかー', 'んめ', 'うみゃー', 'なまらうまい', 'おいしか'];
              const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
              // ★ここでは setEatCount を呼ばない！（二重カウント防止）
              return { ...p, isEating: true, eatTimer: 120, vx: 0, vy: 0, icon: '(・u・)', munchText: randomPhrase };
            }
          }

          // 物理計算の部分（ここはそのままでOK）
          const currentSize = BASE_PARA_SIZE * Math.pow(0.85, p.stage - 1);
          let nextX = p.x + p.vx;
          let nextY = p.y + p.vy;
          let nextVx = p.vx;
          let nextVy = p.vy;
          let stillDropping = p.isDropping;

          if (p.isFood) {
            nextVy += 0.1;
            if (nextY >= STAGE_HEIGHT - currentSize) {
              nextY = STAGE_HEIGHT - currentSize;
              nextVy = -nextVy * 0.2;
              nextVx *= 0.8;
              stillDropping = false;
              if (Math.abs(nextVy) < 1) nextVy = 0;
              if (Math.abs(nextVx) < 0.1) nextVx = 0;
            }
            if (nextX <= 0 || nextX >= STAGE_WIDTH - currentSize) nextVx = -nextVx * 0.5;
          } else {
            if (nextX <= 0 || nextX >= STAGE_WIDTH - currentSize) nextVx = -p.vx;
            if (nextY <= 0 || nextY >= STAGE_HEIGHT - currentSize) nextVy = -p.vy;
          }

          return { ...p, x: nextX, y: nextY, vx: nextVx, vy: nextVy, isDropping: stillDropping };
        });

        // --- 2. 食べ物を消す処理 ---
        const finalParas = movedParas.filter(p => {
          if (!p.isFood) return true;
          
          const isBeingEaten = movedParas.some(para => {
            if (para.isFood || !para.isEating || para.eatTimer !== 120 || p.isDropping) return false;
            const pSize = BASE_PARA_SIZE * Math.pow(0.85, para.stage - 1);
            const fSize = BASE_PARA_SIZE * Math.pow(0.85, p.stage - 1);
            const dx = (para.x + pSize / 2) - (p.x + fSize / 2);
            const dy = (para.y + pSize / 2) - (p.y + fSize / 2);
            return Math.sqrt(dx * dx + dy * dy) < (pSize + fSize) / 3;
          });

          // ★食べ物が消されるときだけ、カウントを1増やす！
          if (isBeingEaten) {
            setEatCount(prev => prev + 1); // ここ1箇所だけにします
            return false;
          }
          return true;
        });

        return finalParas;
      });

      animationFrameId = requestAnimationFrame(move);
    };

    animationFrameId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // ★空の配列にすることで、タイマーの重複を防ぎます

  // 分裂の処理
  const splitParachan = (clickedId: number) => {
  setParas((currentParas) => {
    const result: Parachan[] = [];
    const foodIcons = ['🍎', '🍌', '🍇', '🍓', '🍬', '🍰']; // 食べ物のバリエーション

    currentParas.forEach((p) => {
      // 1. クリックされたのが「食べ物本体」だった場合
      if (p.id === clickedId && p.isFood) {
        result.push(p); // 食べ物自体を消したくない場合は、ここでも自分を残す
        return; 
      }

      // クリックされたのが ぱらちゃん の場合
      if (p.id === clickedId) {
        if (p.stage < MAX_STAGE) {
          // --- 【分裂】まだ小さいサイズでないなら、2匹に増やす ---
          const nextStage = p.stage + 1;
          result.push(
            { ...p, id: Date.now() + Math.random(), stage: nextStage, vx: p.vx, icon: '(・ω・)' },
            { ...p, id: Date.now() + Math.random(), stage: nextStage, vx: -p.vx, icon: '(・ω・)' }
          );
        } else {
          // --- 【食べ物排出】最小サイズなら、自分はそのままで食べ物を1つ追加する ---
          // 自分自身に「もう出したよ」という印をつけて残す
          result.push(p);

          // 新しい「食べ物データ」を1つ追加する
          const randomIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
          result.push({
            id: Date.now() + Math.random(),
            x: p.x, // ぱらちゃんと同じ位置から出す
            y: p.y,
            vx: (Math.random() - 0.5) * 4, // 食べ物は少しランダムな方向に飛ばす
            vy: -5,
            stage: p.stage, // サイズは最小ぱらちゃんと同じにする
            isFood: true,   // これが食べ物であるという印
            icon: randomIcon,
            isDropping: true // 最初は「ドロップ中」にする
          });
        }
      } else {
        // クリックされていないものは、そのまま配列に残す
        result.push(p);
      }
    });
    return result;
  });
};

// リセットボタンが押された時の処理
  const resetParas = () => {
    // 最初の1匹だけの状態に戻します
    setParas([
      { 
        id: Date.now(), 
        x: 370, 
        y: 270, 
        vx: 0.6, 
        vy: 0.6, 
        stage: 1 
      , icon: '(・ω・)'
      }
    ]);
    setEatCount(0);
  };

  return (
    <div className="container">
      <div className="stage">
        {paras.map((p) => {
          const scale = Math.pow(0.85, p.stage - 1);
          return (
            <div
              key={p.id}
              className={`parachan ${p.isFood ? 'food' : ''}`}
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
              onClick={() => splitParachan(p.id)}
            >

              {/* 【追加】もぐもぐ中のセリフ表示 */}
              {p.isEating && (
                <div style={{
                  position: 'absolute',
                  top: '-30px', // ぱらちゃんの少し上に表示
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: 'rgba(0,0,0,0.5)', // 読みやすいように背景を少し暗く
                  padding: '2px 6px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}>
                  {p.munchText}
                </div>
              )}
              {p.icon}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button className="reset-button" onClick={resetParas}>
          最初からやり直す
        </button>
      </div>

      <p style={{ color: 'white', marginTop: '20px' }}>
        クリックして分裂させてね！
        🍎 これまでに食べたフルーツ: <span style={{ fontSize: '24px', color: '#ffeb3b', fontWeight: 'bold' }}>{eatCount}</span> 個
      </p>
    </div>
  )
}

export default App
