import type React from 'react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const FooterMetrics = memo(function FooterMetrics(): React.ReactElement {
  const { t } = useTranslation('core');
  const [sessionTime, setSessionTime] = useState('');
  const networkLink = t('dashboard.online');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const startTime = Date.now();

    const updateSessionTime = () => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      setSessionTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );
    };

    updateSessionTime();
    const interval = setInterval(updateSessionTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel bloom-border p-6 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Session Time */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-white/40">schedule</span>
        <div className="text-[10px] font-data text-white/40 uppercase tracking-widest">
          {t('dashboard.sessionTime')}: <span className="text-accent-500">{sessionTime}</span>
        </div>
      </div>

      {/* Network Link */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-accent-500">wifi</span>
        <div className="text-[10px] font-data text-accent-500 uppercase tracking-widest">
          {t('dashboard.networkLink')}: {networkLink}
        </div>
      </div>

      {/* Copyright */}
      <div className="text-[10px] font-data text-white/20 uppercase tracking-widest">
        © {currentYear} {t('dashboard.copyright')}
      </div>
    </div>
  );
});

export default FooterMetrics;
