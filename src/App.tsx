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
}

function App() {
  const STAGE_WIDTH = 800;
  const STAGE_HEIGHT = 600;
  const BASE_PARA_SIZE = 60; 
  const MAX_STAGE = 4; // 第3世代（4匹）までで分裂を止める設定

  const [paras, setParas] = useState<Parachan[]>([
    { id: Date.now(), x: 370, y: 270, vx: 1, vy: 1, stage: 1 }
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

          if (nextX <= 0 || nextX >= STAGE_WIDTH - currentSize) nextVx = -p.vx;
          if (nextY <= 0 || nextY >= STAGE_HEIGHT - currentSize) nextVy = -p.vy;

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

      currentParas.forEach((p) => {
        if (p.id === clickedId && p.stage < MAX_STAGE) {
          // クリックされた個体を「消して」、新しい世代を「2つ追加」する
          const nextStage = p.stage + 1;

          result.push({ 
            id: Date.now() + Math.random(), 
            x: p.x, 
            y: p.y, 
            vx: p.vx, // そのまま
            vy: p.vy, // そのまま
            stage: nextStage 
          });

          // 2匹目：x方向の速度だけ反転させる（これで左右に別れる）
          result.push({ 
            id: Date.now() + Math.random(), 
            x: p.x, 
            y: p.y, 
            vx: -p.vx, // 向きを反対に
            vy: p.vy,  // y方向はそのまま
            stage: nextStage 
          });

        } else {
          // クリックされていない、または最大まで分裂済みのものはそのまま
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
        vx: 1, 
        vy: 1, 
        stage: 1 
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
              className="parachan"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
              onClick={() => splitParachan(p.id)}
            >
              (・ω・)
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
