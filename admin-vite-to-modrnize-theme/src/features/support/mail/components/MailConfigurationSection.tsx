import React, { useEffect, useState } from 'react';
import { mailConfigurationService } from '@/lib/mail/api/mail.service';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Settings, Server, User, Shield } from 'lucide-react';

interface MailConfigurationSectionProps {
  configId: number;
}

export function MailConfigurationSection({ configId }: MailConfigurationSectionProps) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await mailConfigurationService.getById(configId);
        if (mounted && resp?.data) {
          setConfig(resp.data);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [configId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted py-2">
        <Loader className="h-3 w-3" />
        Loading config...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-xs text-text-muted/50 italic py-2">
        Configuration not found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-text-main font-medium">
        <Server className="h-3.5 w-3.5 text-primary-600" />
        {config.configName || config.config_name || `Config #${configId}`}
        {(config.isActive || config.is_active) && (
          <Badge variant="success" className="text-[8px] px-1.5 py-0">Active</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Server className="h-3 w-3" />
          <span>{config.host}:{config.port}</span>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted">
          <User className="h-3 w-3" />
          <span>{config.userName || config.user_name}</span>
        </div>
        {(config.enableSsl || config.enable_ssl) && (
          <div className="flex items-center gap-1.5 text-text-muted col-span-2">
            <Shield className="h-3 w-3 text-emerald-500" />
            <span>SSL Enabled</span>
          </div>
        )}
      </div>
    </div>
  );
}
