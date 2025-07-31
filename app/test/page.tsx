export default function TestPage() {
  console.log('Test page is rendering');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>테스트 페이지</h1>
      <p>이 페이지가 보인다면 React 렌더링이 정상적으로 작동합니다.</p>
      <button onClick={() => alert('클릭 이벤트 작동!')}>
        클릭 테스트
      </button>
    </div>
  );
}