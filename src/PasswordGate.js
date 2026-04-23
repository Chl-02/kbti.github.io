import { useState } from 'react';

const SITE_PASSWORD = '0214';
const STORAGE_KEY = 'site_auth_v1';

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1'
  );
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authed) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setAuthed(true);
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#fbf7f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Noto Sans KR', sans-serif",
        zIndex: 99999,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '40px 32px',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          width: 320,
          maxWidth: '90vw',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          비공개 사이트
        </div>
        <div style={{ fontSize: 13, color: '#777', marginBottom: 20 }}>
          접속 비밀번호를 입력하세요
        </div>
        <input
          type='password'
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(false);
          }}
          autoFocus
          inputMode='numeric'
          style={{
            width: '100%',
            padding: '12px 14px',
            border: error ? '1.5px solid #e34' : '1.5px solid #ddd',
            borderRadius: 8,
            fontSize: 16,
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 12,
          }}
          aria-label='password'
        />
        {error && (
          <div style={{ color: '#e34', fontSize: 13, marginBottom: 12 }}>
            비밀번호가 올바르지 않습니다
          </div>
        )}
        <button
          type='submit'
          style={{
            width: '100%',
            padding: '12px 0',
            background: '#222',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          입장
        </button>
      </form>
    </div>
  );
}
