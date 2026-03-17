import { describe, expect, it } from 'vitest';
import { homePageSuggestions } from '../lib/localAi';
import type { HardwareInfo, ResourceSnapshot } from '../types';

describe('homePageSuggestions - GPU Temperature Rules', () => {
  const mockSnapshot: ResourceSnapshot = {
    timestamp: 1640995200000,
    cpuPercent: 50,
    cpuTempC: 50,
    memUsedMb: 4096,
    memTotalMb: 8192,
    diskReadKb: 1024,
    diskWriteKb: 2048,
    netRecvKb: 0,
    netSentKb: 0,
  };

  const mockHardwareInfo: HardwareInfo = {
    cpuName: 'Test CPU',
    cpuTempC: 50,
    gpuName: 'Test GPU',
    gpuVramTotalMb: 8192,
    gpuVramUsedMb: 4096,
    gpuTempC: null,
    gpuUsagePercent: null,
  };

  it('should generate critical warning at 95°C', () => {
    const hardwareWithHotGpu: HardwareInfo = {
      ...mockHardwareInfo,
      gpuTempC: 95,
    };

    const suggestions = homePageSuggestions(mockSnapshot, [], hardwareWithHotGpu);

    const criticalGpu = suggestions.find(
      (s) => s.level === 'critical' && s.message.includes('GPU 温度'),
    );

    expect(criticalGpu).toBeDefined();
    expect(criticalGpu?.message).toContain('95°C');
  });

  it('should generate warning at 85°C', () => {
    const hardwareWithWarmGpu: HardwareInfo = {
      ...mockHardwareInfo,
      gpuTempC: 85,
    };

    const suggestions = homePageSuggestions(mockSnapshot, [], hardwareWithWarmGpu);

    const warningGpu = suggestions.find(
      (s) => s.level === 'warn' && s.message.includes('GPU 温度'),
    );

    expect(warningGpu).toBeDefined();
    expect(warningGpu?.message).toContain('85°C');
  });

  it('should not generate GPU suggestions when GPU data is null', () => {
    const suggestions = homePageSuggestions(mockSnapshot, [], mockHardwareInfo);

    const gpuSuggestions = suggestions.filter(
      (s) => s.message.includes('GPU') || s.message.includes('gpu'),
    );

    expect(gpuSuggestions).toHaveLength(0);
  });

  it('should not generate GPU suggestions when GPU temp is 84°C', () => {
    const hardwareWithCoolGpu: HardwareInfo = {
      ...mockHardwareInfo,
      gpuTempC: 84,
    };

    const suggestions = homePageSuggestions(mockSnapshot, [], hardwareWithCoolGpu);

    const gpuSuggestions = suggestions.filter(
      (s) => s.message.includes('GPU') || s.message.includes('gpu'),
    );

    expect(gpuSuggestions).toHaveLength(0);
  });

  it('should handle boundary values correctly', () => {
    // Test 84°C (should not trigger)
    const coolHardware: HardwareInfo = { ...mockHardwareInfo, gpuTempC: 84 };
    const coolSuggestions = homePageSuggestions(mockSnapshot, [], coolHardware);
    expect(coolSuggestions.filter((s) => s.message.includes('GPU'))).toHaveLength(0);

    // Test 85°C (should trigger warning)
    const warmHardware: HardwareInfo = { ...mockHardwareInfo, gpuTempC: 85 };
    const warmSuggestions = homePageSuggestions(mockSnapshot, [], warmHardware);
    expect(
      warmSuggestions.filter((s) => s.level === 'warn' && s.message.includes('GPU 温度')),
    ).toHaveLength(1);

    // Test 94°C (should still be warning)
    const hotHardware: HardwareInfo = { ...mockHardwareInfo, gpuTempC: 94 };
    const hotSuggestions = homePageSuggestions(mockSnapshot, [], hotHardware);
    expect(
      hotSuggestions.filter((s) => s.level === 'warn' && s.message.includes('GPU 温度')),
    ).toHaveLength(1);

    // Test 95°C (should trigger critical)
    const criticalHardware: HardwareInfo = { ...mockHardwareInfo, gpuTempC: 95 };
    const criticalSuggestions = homePageSuggestions(mockSnapshot, [], criticalHardware);
    expect(
      criticalSuggestions.filter((s) => s.level === 'critical' && s.message.includes('GPU 温度')),
    ).toHaveLength(1);
  });
});
