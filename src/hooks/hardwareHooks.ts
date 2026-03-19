import { useShallow } from 'zustand/react/shallow';
import { calculateMemUsagePercent, formatBootTime, formatUptime } from '../lib/hardwareFormatters';
import { useHardwareStore } from '../stores/useHardwareStore';

export const useHardwareData = () => {
  const { info, isListening, error, subscribe } = useHardwareStore(
    useShallow((s) => ({
      info: s.info,
      isListening: s.isListening,
      error: s.error,
      subscribe: s.subscribe,
    })),
  );

  const memUsagePercent = info ? calculateMemUsagePercent(info.memUsedGb, info.memTotalGb) : 0;

  const formattedUptime = info ? formatUptime(info.uptimeSecs) : '--';

  const formattedBootTime = info ? formatBootTime(info.bootTimeUnix) : '--';

  const diskUsagePercent =
    info && info.disks.length > 0 ? (info.disks[0].usedGb / info.disks[0].totalGb) * 100 : null;

  return {
    info,
    isLoading: !isListening && info === null,
    error,
    memUsagePercent,
    formattedUptime,
    formattedBootTime,
    diskUsagePercent,
    fetchHardware: subscribe,
  };
};
