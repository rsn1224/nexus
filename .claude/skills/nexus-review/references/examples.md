# コード品質チェック — 詳細と例

## コード品質チェックリスト

- `console.log` なし → `log.info/error`（src/lib/logger.ts を使う）
- `any` 型なし
- `invoke` は `src/lib/tauri-commands.ts` 経由で呼ぶ（直接 import 禁止）
- `npm run typecheck` PASS
- `npm run check` PASS
- `npm run test` PASS

## Good / Bad 例

### インラインスタイル

```tsx
// NG
<div style={{ color: 'var(--color-accent-500)', fontSize: '11px' }}>

// OK
<div className="text-accent-500 text-[11px]">
```

### CSS 変数

```tsx
// NG: 存在しない変数
className="text-[var(--color-background)]"
className="text-[var(--color-primary-500)]"
className="border-[var(--color-border)]"

// OK: 定義済みの変数
className="bg-base-800"
className="text-accent-500"
className="border-border-subtle"
```

### hover 処理

```tsx
// OK: Tailwind hover: ユーティリティーを使う（v4 推奨）
<button className="text-secondary hover:text-primary transition-colors">

// NG: インラインスタイルで hover 管理
const [isHovered, setIsHovered] = useState(false);
<button style={{ color: isHovered ? ... : ... }}>
```

### Tauri invoke エラーハンドリング

```tsx
// NG: invoke エラーを Error インスタンスとして扱う
catch (err) {
  set({ error: (err as Error).message });
}

// OK: plain object 対応（Tauri v2 は Error インスタンスを返さない）
catch (err) {
  const message = err instanceof Error ? err.message : JSON.stringify(err);
  set({ error: message });
}
```

### Zustand セレクター

```tsx
// NG: オブジェクト全体サブスクライブ（毎回新オブジェクト生成）
const store = useSystemStore();

// OK: useShallow で必要な値のみ
const { cpu, gpu } = useSystemStore(
  useShallow((s) => ({ cpu: s.cpuPercent, gpu: s.gpuPercent }))
);
```
