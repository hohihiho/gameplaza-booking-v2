'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function FaviconGeneratorPage() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Google Fonts 동적 로드
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // 폰트 로드 확인
    document.fonts.ready.then(() => {
      setTimeout(() => {
        setFontsLoaded(true);
      }, 500);
    });

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;

    const sizes = [
      { id: 'light16', size: 16, bg: '#EEF2FF', color: '#6366F1', label: 'Light Mode (16x16)' },
      { id: 'dark16', size: 16, bg: '#4F46E5', color: '#FFFFFF', label: 'Dark Mode (16x16)' },
      { id: 'light32', size: 32, bg: '#EEF2FF', color: '#6366F1', label: 'Light Mode (32x32)' },
      { id: 'dark32', size: 32, bg: '#4F46E5', color: '#FFFFFF', label: 'Dark Mode (32x32)' },
      { id: 'light192', size: 192, bg: '#EEF2FF', color: '#6366F1', label: 'Light Mode (192x192)' },
      { id: 'dark192', size: 192, bg: '#4F46E5', color: '#FFFFFF', label: 'Dark Mode (192x192)' },
      { id: 'light512', size: 512, bg: '#EEF2FF', color: '#6366F1', label: 'Light Mode (512x512)' },
      { id: 'dark512', size: 512, bg: '#4F46E5', color: '#FFFFFF', label: 'Dark Mode (512x512)' },
      { id: 'light1024', size: 1024, bg: '#EEF2FF', color: '#6366F1', label: 'Light Mode (1024x1024)' },
      { id: 'dark1024', size: 1024, bg: '#4F46E5', color: '#FFFFFF', label: 'Dark Mode (1024x1024)' },
    ];

    sizes.forEach(({ id, size, bg, color }) => {
      const canvas = document.getElementById(id) as HTMLCanvasElement;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 배경 그리기
      ctx.fillStyle = bg;
      roundRect(ctx, 0, 0, size, size, size * 0.15);
      ctx.fill();

      // 그라데이션
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      roundRect(ctx, 0, 0, size, size, size * 0.15);
      ctx.fill();

      // 텍스트 설정
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 폰트 크기와 위치 조정
      let fontSize, yOffset;
      if (size === 1024) {
        fontSize = 800;
        yOffset = 60;
      } else if (size === 512) {
        fontSize = 400;
        yOffset = 30;
      } else if (size === 192) {
        fontSize = 150;
        yOffset = 10;
      } else if (size === 32) {
        fontSize = 26;
        yOffset = 2;
      } else {
        fontSize = 14;
        yOffset = 1;
      }

      ctx.font = `900 ${fontSize}px Orbitron, monospace`;
      ctx.fillText('G', size / 2, size / 2 + yOffset);
    });
  }, [fontsLoaded]);

  const download = (canvasId: string, filename: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
  };

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">게임플라자 Favicon Generator</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {fontsLoaded ? 'Orbitron 폰트가 로드되었습니다!' : 'Orbitron 폰트 로딩 중...'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* 16x16 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Light Mode (16x16)</h3>
            <canvas id="light16" width="16" height="16" className="mx-auto mb-4" />
            <button
              onClick={() => download('light16', 'favicon-light-16x16.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Dark Mode (16x16)</h3>
            <canvas id="dark16" width="16" height="16" className="mx-auto mb-4" />
            <button
              onClick={() => download('dark16', 'favicon-dark-16x16.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          {/* 32x32 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Light Mode (32x32)</h3>
            <canvas id="light32" width="32" height="32" className="mx-auto mb-4" />
            <button
              onClick={() => download('light32', 'favicon-light-32x32.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Dark Mode (32x32)</h3>
            <canvas id="dark32" width="32" height="32" className="mx-auto mb-4" />
            <button
              onClick={() => download('dark32', 'favicon-dark-32x32.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          {/* 192x192 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Light Mode (192x192)</h3>
            <canvas id="light192" width="192" height="192" className="mx-auto mb-4 w-full max-w-[192px]" />
            <button
              onClick={() => download('light192', 'favicon-light-192x192.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Dark Mode (192x192)</h3>
            <canvas id="dark192" width="192" height="192" className="mx-auto mb-4 w-full max-w-[192px]" />
            <button
              onClick={() => download('dark192', 'favicon-dark-192x192.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          {/* 512x512 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Light Mode (512x512)</h3>
            <canvas id="light512" width="512" height="512" className="mx-auto mb-4 w-full max-w-[200px]" />
            <button
              onClick={() => download('light512', 'favicon-light-512x512.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Dark Mode (512x512)</h3>
            <canvas id="dark512" width="512" height="512" className="mx-auto mb-4 w-full max-w-[200px]" />
            <button
              onClick={() => download('dark512', 'favicon-dark-512x512.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          {/* 1024x1024 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow col-span-2">
            <h3 className="font-semibold mb-4">Light Mode (1024x1024) - 울트라</h3>
            <canvas id="light1024" width="1024" height="1024" className="mx-auto mb-4 w-full max-w-[300px]" />
            <button
              onClick={() => download('light1024', 'favicon-light-1024x1024.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow col-span-2">
            <h3 className="font-semibold mb-4">Dark Mode (1024x1024) - 울트라</h3>
            <canvas id="dark1024" width="1024" height="1024" className="mx-auto mb-4 w-full max-w-[300px]" />
            <button
              onClick={() => download('dark1024', 'favicon-dark-1024x1024.png')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              <Download size={16} />
              다운로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}