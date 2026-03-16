import '@testing-library/jest-dom';

// Tauri API mock
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));
