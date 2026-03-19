import { invoke } from '@tauri-apps/api/core';
import type { AdvisorResult, PowerPlan, VisualEffects, WindowsSettings } from '../types';

export async function fetchWindowsSettings(): Promise<WindowsSettings> {
  return await invoke<WindowsSettings>('get_windows_settings');
}

export async function setPowerPlan(plan: PowerPlan): Promise<void> {
  await invoke('set_power_plan', { plan });
}

export async function toggleGameMode(): Promise<boolean> {
  return await invoke<boolean>('toggle_game_mode');
}

export async function toggleFullscreenOptimization(): Promise<boolean> {
  return await invoke<boolean>('toggle_fullscreen_optimization');
}

export async function toggleHardwareGpuScheduling(): Promise<boolean> {
  return await invoke<boolean>('toggle_hardware_gpu_scheduling');
}

export async function setVisualEffects(effect: VisualEffects): Promise<void> {
  await invoke('set_visual_effects', { effect });
}

export async function fetchAdvisorResult(): Promise<AdvisorResult> {
  return await invoke<AdvisorResult>('get_settings_advice');
}

export async function applyRecommendation(settingId: string): Promise<void> {
  await invoke('apply_recommendation', { settingId });
}

export async function applyAllSafeRecommendations(): Promise<void> {
  const result = await invoke<AdvisorResult>('get_settings_advice');
  const safeItems = result.recommendations.filter((r) => r.safetyLevel === 'safe' && !r.isOptimal);
  for (const item of safeItems) {
    await invoke('apply_recommendation', { settingId: item.settingId });
  }
}
