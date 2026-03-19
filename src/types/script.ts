export interface ScriptEntry {
  id: string;
  name: string;
  path: string;
  scriptType: 'powershell' | 'python';
  description: string;
  createdAt: number;
}

export interface ExecutionLog {
  id: string;
  scriptId: string;
  scriptName: string;
  startedAt: number;
  durationMs: number;
  exitCode: number;
  stdout: string;
  stderr: string;
}
