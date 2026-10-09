import React from 'react';
import { Lock, Save } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';

/**
 * Tab 1: Cấu hình Thông tin Pháp nhân Quỹ tín dụng nhân dân Yên Thọ
 */
const GeneralLegalSettings = ({
  systemSettings,
  setSystemSettings,
  onSave,
  isSaving,
  canConfigureWebapp
}) => {
  return (
    <Card title="Thông Tin Đơn Vị (QTDND Yên Thọ)">
      {!canConfigureWebapp && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Chỉ xem:</strong> Thông tin đơn vị được bảo vệ. Chỉ Quản trị viên và Ban Lãnh đạo mới có quyền chỉnh sửa.
          </span>
        </div>
      )}

      <form onSubmit={onSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tên đơn vị"
            value={systemSettings.unitName || ''}
            onChange={(e) => setSystemSettings((prev) => ({ ...prev, unitName: e.target.value }))}
            disabled={!canConfigureWebapp}
            required
          />
          <Input
            label="Tên viết tắt"
            value={systemSettings.shortName || ''}
            onChange={(e) => setSystemSettings((prev) => ({ ...prev, shortName: e.target.value }))}
            disabled={!canConfigureWebapp}
          />
        </div>

        <Input
          label="Địa chỉ trụ sở"
          value={systemSettings.address || ''}
          onChange={(e) => setSystemSettings((prev) => ({ ...prev, address: e.target.value }))}
          disabled={!canConfigureWebapp}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Số giấy phép thành lập & hoạt động"
            value={systemSettings.licenseNo || ''}
            onChange={(e) => setSystemSettings((prev) => ({ ...prev, licenseNo: e.target.value }))}
            disabled={!canConfigureWebapp}
          />
          <Input
            label="Số điện thoại liên hệ"
            value={systemSettings.phone || ''}
            onChange={(e) => setSystemSettings((prev) => ({ ...prev, phone: e.target.value }))}
            disabled={!canConfigureWebapp}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Chủ tịch Hội đồng Quản trị"
            value={systemSettings.chairmanName || ''}
            onChange={(e) => setSystemSettings((prev) => ({ ...prev, chairmanName: e.target.value }))}
            disabled={!canConfigureWebapp}
          />
          <Input
            label="Giám đốc"
            value={systemSettings.directorName || ''}
            onChange={(e) => setSystemSettings((prev) => ({ ...prev, directorName: e.target.value }))}
            disabled={!canConfigureWebapp}
          />
        </div>

        {canConfigureWebapp && (
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              isLoading={isSaving}
              className="font-bold"
            >
              Lưu thông tin đơn vị
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

export default GeneralLegalSettings;
