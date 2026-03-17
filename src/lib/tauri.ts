/**
 * Tauri v2 の invoke エラー（plain object / string / Error）を安全に文字列化する
 */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.Command === 'string') return obj.Command;
  }
  return JSON.stringify(err);
}
