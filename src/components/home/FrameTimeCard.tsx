import { useEffect, useRef } from 'react';
import { useFrameTimeActions, useFrameTimeState } from '../../stores/useFrameTimeStore';
import FrameTimeGraph from './FrameTimeGraph';

export default function FrameTimeCard() {
  const { monitorState, snapshot, isLoading, error } = useFrameTimeState();
  const { startMonitor, stopMonitor, getStatus, setupListeners } = useFrameTimeActions();
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 初期化: 現在の状態を取得
    getStatus();

    // イベントリスナーをセットアップ
    (async () => {
      const unlisten = await setupListeners();
      unlistenRef.current = unlisten;
    })();

    // クリーンアップ
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [getStatus, setupListeners]);

  const handleStart = () => {
    // TODO: 実際のゲームPIDを取得するロジックが必要
    // ここでは仮に 1234 を使用
    startMonitor(1234, 'game.exe');
  };

  const handleStop = () => {
    stopMonitor();
  };

  if (monitorState.type === 'error') {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-danger-500)',
          borderRadius: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-danger-500)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>FRAME TIME ERROR</div>
        <div>{monitorState.message}</div>
        {error && <div style={{ marginTop: '4px', fontSize: '10px' }}>{error}</div>}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--color-accent-500)' }}>
          FRAME TIME
        </div>
        <div
          style={{
            fontSize: '9px',
            color:
              monitorState.type === 'monitoring'
                ? 'var(--color-success-500)'
                : 'var(--color-text-muted)',
          }}
        >
          {monitorState.type === 'monitoring' ? 'MONITORING' : 'STOPPED'}
        </div>
      </div>

      {/* プロセス情報 */}
      {monitorState.type === 'monitoring' && (
        <div
          style={{ marginBottom: '12px', fontSize: '10px', color: 'var(--color-text-secondary)' }}
        >
          <div>PID: {monitorState.pid}</div>
          <div>PROCESS: {monitorState.processName}</div>
        </div>
      )}

      {/* FPS 指標 */}
      {snapshot && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>AVG FPS</div>
              <div
                style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-accent-500)' }}
              >
                {snapshot.avgFps.toFixed(1)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>1% LOW</div>
              <div
                style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-warning-500)' }}
              >
                {snapshot.pct1Low.toFixed(1)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>0.1% LOW</div>
              <div
                style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-danger-500)' }}
              >
                {snapshot.pct01Low.toFixed(1)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>
              STUTTERS:{' '}
              <span
                style={{
                  color:
                    snapshot.stutterCount > 0
                      ? 'var(--color-danger-500)'
                      : 'var(--color-success-500)',
                }}
              >
                {snapshot.stutterCount}
              </span>
            </div>
            <div style={{ color: 'var(--color-text-muted)' }}>
              LAST: {snapshot.lastFrameTimeMs.toFixed(1)} ms
            </div>
          </div>
        </div>
      )}

      {/* グラフ */}
      {snapshot && snapshot.frameTimes.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <FrameTimeGraph frameTimes={snapshot.frameTimes} />
        </div>
      )}

      {/* コントロールボタン */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {monitorState.type === 'stopped' ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '6px 12px',
              backgroundColor: isLoading ? 'var(--color-surface)' : 'var(--color-accent-500)',
              color: isLoading ? 'var(--color-text-muted)' : 'var(--color-surface)',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'STARTING...' : 'START'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '6px 12px',
              backgroundColor: 'var(--color-danger-500)',
              color: 'var(--color-surface)',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'STOPPING...' : 'STOP'}
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div style={{ marginTop: '8px', fontSize: '9px', color: 'var(--color-danger-500)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
