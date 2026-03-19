import type {
  HealthFactor,
  HealthFactorStatus,
  HealthGrade,
  HealthInput,
  HealthScore,
} from '../types/v2';

// =============================================================================
// Health Score — 純粋関数（ADR-003）
// =============================================================================

const THRESHOLDS = {
  cpuTempCritical: 90,
  cpuTempWarn: 80,
  gpuTempCritical: 95,
  gpuTempWarn: 85,
  memCritical: 0.95,
  memWarn: 0.8,
  bottleneckCritical: 0.7,
  bottleneckWarn: 0.3,
} as const;

function grade(score: number): HealthGrade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function boolFactor(enabled: boolean, name: string, maxPoints: number): HealthFactor {
  return {
    name,
    points: enabled ? maxPoints : 0,
    maxPoints,
    status: enabled ? 'optimal' : 'suboptimal',
  };
}

function tempFactor(
  temp: number | null,
  name: string,
  warnThreshold: number,
  criticalThreshold: number,
): { factor: HealthFactor; warning: string | null } {
  if (temp === null) {
    return {
      factor: { name, points: 10, maxPoints: 10, status: 'optimal' },
      warning: null,
    };
  }
  let points = 10;
  let status: HealthFactorStatus = 'optimal';
  let warning: string | null = null;

  if (temp >= criticalThreshold) {
    points = 0;
    status = 'critical';
    warning = `${name} が危険水準です: ${temp}℃`;
  } else if (temp >= warnThreshold) {
    points = 5;
    status = 'suboptimal';
    warning = `${name} が高めです: ${temp}℃`;
  }

  return { factor: { name, points, maxPoints: 10, status }, warning };
}

function gradientFactor(
  ratio: number,
  name: string,
  warnThreshold: number,
  criticalThreshold: number,
): HealthFactor {
  let points = 10;
  let status: HealthFactorStatus = 'optimal';

  if (ratio >= criticalThreshold) {
    points = 0;
    status = 'critical';
  } else if (ratio >= warnThreshold) {
    points = 5;
    status = 'suboptimal';
  }

  return { name, points, maxPoints: 10, status };
}

export function calcHealthScore(input: HealthInput): HealthScore {
  const memUsageRatio = input.memTotalGb > 0 ? input.memUsedGb / input.memTotalGb : 0;

  const factors: HealthFactor[] = [];
  const warnings: string[] = [];
  let score = 0;

  const add = (f: HealthFactor): void => {
    factors.push(f);
    score += f.points;
  };

  add(boolFactor(input.gameModeEnabled, 'Game Mode', 15));
  add(boolFactor(input.powerPlanHighPerf, '電源プラン', 15));
  add(boolFactor(input.timerResolutionLow, 'Timer Resolution', 10));
  add(boolFactor(input.nagleDisabled, 'Nagle 無効', 10));
  add(boolFactor(input.visualEffectsOff, '視覚効果 OFF', 10));

  const { factor: cpuF, warning: cpuW } = tempFactor(
    input.cpuTemp,
    'CPU 温度',
    THRESHOLDS.cpuTempWarn,
    THRESHOLDS.cpuTempCritical,
  );
  add(cpuF);
  if (cpuW) warnings.push(cpuW);

  const { factor: gpuF, warning: gpuW } = tempFactor(
    input.gpuTemp,
    'GPU 温度',
    THRESHOLDS.gpuTempWarn,
    THRESHOLDS.gpuTempCritical,
  );
  add(gpuF);
  if (gpuW) warnings.push(gpuW);

  add(gradientFactor(memUsageRatio, 'MEM 使用率', THRESHOLDS.memWarn, THRESHOLDS.memCritical));
  add(
    gradientFactor(
      input.bottleneckRatio,
      'ボトルネック',
      THRESHOLDS.bottleneckWarn,
      THRESHOLDS.bottleneckCritical,
    ),
  );

  const pendingCount = factors.filter((f) => f.status !== 'optimal').length;
  const potentialGain = factors.reduce((acc, f) => acc + (f.maxPoints - f.points), 0);
  const label =
    pendingCount > 0
      ? `${pendingCount}つの改善で推定 +${potentialGain} ポイント`
      : 'システム状態は最適です';

  return { score, grade: grade(score), factors, warnings, label };
}
