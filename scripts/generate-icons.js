const fs = require('fs');
const path = require('path');

// SVG 템플릿 함수
function createIconSVG(size) {
  const scale = size / 512;
  const fontSize = Math.round(size * 0.4);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.25}" fill="#3B82F6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">🎮</text>
</svg>`;
}

// 생성할 아이콘 크기들
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// public/icons 디렉토리 확인
const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 각 크기별로 SVG 파일 생성
sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Created ${filename}`);
});

// HTML Canvas를 사용한 간단한 PNG 생성기 (실제 환경에서는 sharp 등의 라이브러리 사용 권장)
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
</head>
<body>
  <h1>PWA 아이콘 생성 완료!</h1>
  <p>SVG 파일들이 생성되었습니다. PNG로 변환하려면 다음 중 하나를 사용하세요:</p>
  <ul>
    <li>온라인 변환 도구 (예: cloudconvert.com)</li>
    <li>npm install sharp 후 변환 스크립트 실행</li>
    <li>ImageMagick: convert icon-192x192.svg icon-192x192.png</li>
  </ul>
  <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
    ${sizes.map(size => `
      <div style="text-align: center;">
        <img src="/icons/icon-${size}x${size}.svg" width="${Math.min(size, 128)}" height="${Math.min(size, 128)}" style="border: 1px solid #ddd; border-radius: 10px;">
        <p>${size}x${size}</p>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

// 아이콘 미리보기 HTML 생성
fs.writeFileSync(path.join(iconsDir, 'preview.html'), htmlContent);

console.log('\n✨ 아이콘 생성 완료!');
console.log('📁 위치: public/icons/');
console.log('👁️  미리보기: public/icons/preview.html');
console.log('\n💡 PNG 변환을 위해서는 sharp 라이브러리를 설치하거나 온라인 도구를 사용하세요.');