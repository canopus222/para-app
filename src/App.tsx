import { useState, useEffect } from 'react'
import './App.css'

// ぱらちゃん1匹のデータの形を定義（TypeScript用）
interface Parachan {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function App() {
  // 箱のサイズ
  const STAGE_WIDTH = 800;
  const STAGE_HEIGHT = 600;
  const PARA_SIZE = 60; // ぱらちゃんの大きさ

  // 1. ぱらちゃんたちを「リスト（配列）」で管理する
  const [paras, setParas] = useState<Parachan[]>([
    { id: Date.now(), x: 100, y: 100, vx: 1.5, vy: 1.5 }
  ]);

  // 2. 動きのループ
  useEffect(() => {
    const move = () => {
      setParas((currentParas) => 
        currentParas.map((p) => {
          let nextX = p.x + p.vx;
          let nextY = p.y + p.vy;
          let nextVx = p.vx;
          let nextVy = p.vy;

          // 横のカベ判定（0 または 箱の幅 - ぱらちゃんの幅）
          if (nextX <= 0 || nextX >= STAGE_WIDTH - PARA_SIZE) {
            nextVx = -p.vx; // 向きを反転
          }
          // 縦のカベ判定
          if (nextY <= 0 || nextY >= STAGE_HEIGHT - PARA_SIZE) {
            nextVy = -p.vy; // 向きを反転
          }

          return { ...p, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
        })
      );
    };

    const timer = requestAnimationFrame(move);
    return () => cancelAnimationFrame(timer);
  }, [paras]);

  return (
    // 外側の背景
    <div className="container">
      {/* ぱらちゃんの「箱」 */}
      <div className="stage">
        {paras.map((p) => (
          <div
            key={p.id}
            className="parachan"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
            }}
            onClick={() => alert("次はここをクリックで分裂させます！")}
          >
            (・ω・)
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
