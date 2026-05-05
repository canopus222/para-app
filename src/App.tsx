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
}

function App() {
  const STAGE_WIDTH = 800;
  const STAGE_HEIGHT = 600;
  const BASE_PARA_SIZE = 60; 
  const MAX_STAGE = 4; // 第3世代（4匹）までで分裂を止める設定

  const [paras, setParas] = useState<Parachan[]>([
    { id: Date.now(), x: 370, y: 270, vx: 0.6, vy: 0.6, stage: 1, icon: '(・ω・)'}
  ]);

  useEffect(() => {
    const move = () => {
      setParas((currentParas) =>
        currentParas.map((p) => {
          // 世代が上がるごとにサイズを 80% ずつ小さくする計算
          const currentSize = BASE_PARA_SIZE * Math.pow(0.85, p.stage - 1);
          
          let nextX = p.x + p.vx;
          let nextY = p.y + p.vy;
          let nextVx = p.vx;
          let nextVy = p.vy;

          // --- 食べ物専用の物理法則 ---
          if (p.isFood) {
            // 1. 重力を加える（少しずつ下に引っ張る）
            nextVy += 0.1;

            // 2. 床（ステージの底）に当たった時のバウンド処理
            if (nextY >= STAGE_HEIGHT - currentSize) {
              nextY = STAGE_HEIGHT - currentSize;
              nextVy = -nextVy * 0.2; // 跳ね返り係数（半分くらいの勢いで跳ねる）
              nextVx *= 0.8; // 摩擦で横移動も少し減速

              // 速度が十分に小さくなったら完全に止める
              if (Math.abs(nextVy) < 1) nextVy = 0;
              if (Math.abs(nextVx) < 0.1) nextVx = 0;
            }

            // 3. 壁に当たった時
            if (nextX <= 0 || nextX >= STAGE_WIDTH - currentSize) {
              nextVx = -nextVx * 0.5;
            }
          } else {
            // --- 通常のぱらちゃんの跳ね返り（今まで通り） ---
            if (nextX <= 0 || nextX >= STAGE_WIDTH - currentSize) nextVx = -p.vx;
            if (nextY <= 0 || nextY >= STAGE_HEIGHT - currentSize) nextVy = -p.vy;
          }

          return { ...p, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
        })
      );
    };
    const timer = requestAnimationFrame(move);
    return () => cancelAnimationFrame(timer);
  }, [paras]);

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
        } else if (!p.hasDroppedFood) {
          // --- 【食べ物排出】最小サイズなら、自分はそのままで食べ物を1つ追加する ---
          // 1. 自分自身に「もう出したよ」という印をつけて残す
          result.push({ ...p, hasDroppedFood: true });

          // 2. 新しい「食べ物データ」を1つ追加する
          const randomIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
          result.push({
            id: Date.now() + Math.random(),
            x: p.x, // ぱらちゃんと同じ位置から出す
            y: p.y,
            vx: (Math.random() - 0.5) * 4, // 食べ物は少しランダムな方向に飛ばす
            vy: -5,
            stage: p.stage, // サイズは最小ぱらちゃんと同じにする
            isFood: true,   // これが食べ物であるという印
            icon: randomIcon
          });
        } else {
          // すでに食べ物を出したことがある最小ぱらちゃんは、これ以上分裂も食べ物も出さない
          result.push(p);
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
        クリックして分裂させてね！ (現在: {paras.length} 匹 / 第{paras[0]?.stage || 0}世代)
      </p>
    </div>
  )
}

export default App
