import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { handleApiError } from '@/lib/error-handler';
import { apiService } from '@/lib/api.service';
import { API_MODULES } from '@/constants/api';
import { useMenuTitle } from '@/hooks/useMenuTitle';
import { Settings, Edit2, RotateCw, Save, Search, Settings2, Sliders } from 'lucide-react';

export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [description, setDescription] = useState('');
  const [moduleName, setModuleName] = useState('');

  const pageTitle = useMenuTitle();
  const { toast, ToastComponent } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const resp: any = await apiService.get(API_MODULES.AUTH, '/global-setting/all');
      setSettings(resp?.data || []);
    } catch (err) {
      console.error('Failed to load global settings:', err);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSetting(null);
    setSettingKey('');
    setSettingValue('');
    setDescription('');
    setModuleName('');
  };

  const handleEdit = (setting: any) => {
    setSelectedSetting(setting);
    setSettingKey(setting.setting_key || setting.settingKey || '');
    setSettingValue(setting.setting_value || setting.settingValue || '');
    setDescription(setting.description || '');
    setModuleName(setting.module_name || setting.moduleName || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!settingKey.trim()) {
      toast({ title: 'Validation Error', description: 'Setting Key is required.', status: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        setting_key: settingKey.trim(),
        setting_value: settingValue.trim(),
        description: description.trim(),
        module_name: moduleName.trim()
      };

      const res: any = await apiService.post(
        API_MODULES.AUTH,
        '/global-setting/save',
        payload
      );

      if (res && (res.status_code === 200 || res.response_code === 'SUCCESS' || res.response_code === 'OK')) {
        toast({ title: 'Success', description: 'Setting saved successfully.', status: 'success' });
        handleCloseModal();
        await fetchSettings();
      } else {
        toast(handleApiError(res));
      }
    } catch (err) {
      toast(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredSettings = settings.filter(s => {
    const key = (s.setting_key || s.settingKey || '').toLowerCase();
    const val = (s.setting_value || s.settingValue || '').toLowerCase();
    const desc = (s.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return key.includes(query) || val.includes(query) || desc.includes(query);
  });

  return (
    <div className="space-y-6">
      <ToastComponent />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-main">
            {pageTitle || 'Global Configuration Settings'}
          </h2>
          <p className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">
            Maintain application parameters, feature toggles, API keys, and module-specific configurations.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card-bg px-4 py-2.5 rounded-xl border border-border-theme shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted/50 h-full w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search key, value, or description..."
            className="pl-8 h-9 border-slate-200 rounded-xl text-xs font-semibold shadow-sm"
          />
        </div>
        <Button
          variant="outline"
          onClick={fetchSettings}
          className="h-9 w-9 p-0 text-text-muted hover:text-primary-600 rounded-xl"
        >
          <RotateCw className={`h-4 w-4 ${loading && 'animate-spin'}`} />
        </Button>
      </div>

      <div className="bg-card-bg rounded-xl border border-border-theme shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-theme">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Key Name</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Setting Value</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Module</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">Description</th>
                <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-slate-500 w-20">Edit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border-theme text-[11px] font-semibold text-slate-700">
              {loading && settings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20">
                    <Settings2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                  </td>
                </tr>
              ) : filteredSettings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-text-muted">
                    No global settings found.
                  </td>
                </tr>
              ) : (
                filteredSettings.map((s, idx) => {
                  const key = s.setting_key || s.settingKey || '—';
                  const val = s.setting_value || s.settingValue || '—';
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-text-main text-[10px]">{key}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate font-mono text-xs text-slate-600 bg-slate-50/50">{val}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] uppercase border">
                          {s.module_name || s.moduleName || 'common'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted font-normal max-w-[250px] truncate">{s.description || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(s)}
                          className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Edit Configuration Parameter"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Setting Key</Label>
            <Input
              value={settingKey}
              disabled={true}
              className="h-10 bg-slate-50 font-mono text-xs font-bold text-slate-500"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Setting Value</Label>
            <Input
              value={settingValue}
              onChange={(e) => setSettingValue(e.target.value)}
              placeholder="Value details..."
              className="h-10 border-slate-200 rounded-xl font-mono text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Module Group</Label>
            <Input
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="e.g. AUTH, SCM, FINANCE"
              className="h-10 border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ps-1">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key purpose or variable specs..."
              className="h-10 border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              isLoading={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
