# コード品質チェック — 詳細と例

## コード品質チェックリスト

- `console.log` なし → `log.info/error` (pino)
- `any` 型なし
- モック `invoke` なし → `import { invoke } from '@tauri-apps/api/core'`
- `npm run typecheck` PASS
- `npm run check` PASS
- `npm run test` PASS

## Good / Bad 例

### インラインスタイル

```tsx
// NG
<div style={{ color: 'var(--color-accent-500)', fontSize: '11px' }}>

// OK
<div className="text-(--color-accent-500) text-[11px]">
```

### CSS 変数

```tsx
// NG: 存在しない変数
className="text-[var(--color-background)]"
className="text-[var(--color-primary-500)]"
className="border-[var(--color-border)]"

// OK: 定義済みの変数
className="bg-base-900"
className="text-(--color-accent-500)"
className="border-border-subtle"
```

### hover 処理

```tsx
// NG: CSS :hover
<button className="hover:bg-blue-500">

// OK: useState で管理
const [isHovered, setIsHovered] = useState(false);
<button
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  className={isHovered ? 'bg-base-700' : 'bg-transparent'}
>
```

### エラーハンドリング

```tsx
// NG: invoke エラーを Error として扱う
catch (err) {
  set({ error: (err as Error).message });
}

// OK: plain object 対応
catch (err) {
  const message = err instanceof Error ? err.message : JSON.stringify(err);
  set({ error: message });
}
```
