import React from 'react';
import { ShieldCheck, RotateCcw, Save } from 'lucide-react';
import Button from '../../../../components/common/Button';
import { 
  TRUST_PERMISSIONS_CONFIG, 
  SYSTEM_ROLES_LIST, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../../../../lib/permissions';

/**
 * Ma trận Phân Quyền Chuyên Biệt Phân Hệ Bỏ Phiếu Tín Nhiệm
 * Cho phép Quản trị viên tùy chỉnh quyền hạn cho từng chức danh/vai trò
 */
const TrustPermissionsMatrix = ({
  permissions = DEFAULT_ROLE_PERMISSIONS.trust,
  onChangePermissions,
  onResetDefault,
  onSavePermissions,
  isSaving = false,
}) => {
  const handleToggle = (roleCode, permKey) => {
    if (roleCode === 'superadmin') return; // SuperAdmin luôn có toàn quyền

    const currentList = permissions[roleCode] || [];
    let updatedList;
    if (currentList.includes(permKey)) {
      updatedList = currentList.filter((k) => k !== permKey);
    } else {
      updatedList = [...currentList, permKey];
    }

    onChangePermissions({
      ...permissions,
      [roleCode]: updatedList,
    });
  };

  return (
    <div className="border border-teal-200 rounded-3xl bg-white p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0f766e]" />
            <span>Phân Quyền Chuyên Biệt Phân Hệ Bỏ Phiếu Tín Nhiệm (RBAC Matrix)</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình quyền thao tác chi tiết theo từng vai trò trong quy trình lấy phiếu tín nhiệm QTDND Yên Thọ.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={onResetDefault}
            className="text-xs font-semibold text-slate-600 hover:text-teal-800 border-slate-300"
          >
            Khôi phục chuẩn
          </Button>

          {onSavePermissions && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={isSaving}
              onClick={onSavePermissions}
              className="text-xs font-bold shadow-xs"
            >
              Lưu Phân Quyền Tín Nhiệm
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-teal-50/70 text-slate-700 font-bold border-b border-teal-200">
              <th className="py-2.5 px-3 min-w-[220px]">Quyền hạn phân hệ</th>
              {SYSTEM_ROLES_LIST.map((role) => (
                <th
                  key={role.code}
                  className="py-2.5 px-2 text-center min-w-[100px] text-[11px]"
                  title={role.label}
                >
                  <div className="font-bold text-slate-900">{role.label.split('(')[0].trim()}</div>
                  <div className="text-[10px] text-teal-800 font-normal">({role.code})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TRUST_PERMISSIONS_CONFIG.map((perm) => (
              <tr key={perm.key} className="hover:bg-slate-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="font-bold text-slate-900">{perm.label}</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {perm.description}
                  </div>
                  <span className="font-mono text-[9px] text-[#0f766e] bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 mt-1 inline-block">
                    {perm.key}
                  </span>
                </td>

                {SYSTEM_ROLES_LIST.map((role) => {
                  const isSuper = role.code === 'superadmin';
                  const rolePerms = permissions[role.code] || [];
                  const isChecked = isSuper || rolePerms.includes(perm.key) || rolePerms.includes('*');

                  return (
                    <td key={role.code} className="py-2.5 px-2 text-center align-middle">
                      <label className="inline-flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isSuper}
                          onChange={() => handleToggle(role.code, perm.key)}
                          className="w-4 h-4 rounded text-[#0f766e] focus:ring-[#0f766e] border-slate-300 accent-[#0f766e] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                        />
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span>* Lưu ý nguyên tắc an toàn:</span>
          <span className="font-normal text-slate-500">
            Cán bộ nhân viên chỉ được xem điểm của bản thân và phiếu đã chấm của mình; Lãnh đạo và Ban Kiểm soát có quyền giám sát toàn Quỹ.
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrustPermissionsMatrix);
