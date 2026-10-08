import React from 'react';
import { ShieldCheck, RotateCcw, Save } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { 
  GLOBAL_PERMISSIONS_CONFIG, 
  SYSTEM_ROLES_LIST, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../../../../lib/permissions';

/**
 * Quản trị Ma trận Phân Quyền Vai Trò Toàn Hệ Thống (Global RBAC Matrix)
 * Cho phép thiết lập quyền truy cập cho từng chức danh/vai trò
 */
const GlobalRolePermissionsSettings = ({
  globalPermissions = DEFAULT_ROLE_PERMISSIONS.global,
  onChangeGlobalPermissions,
  onSavePermissions,
  onResetDefault,
  isSaving = false,
}) => {
  const handleToggle = (roleCode, permKey) => {
    if (roleCode === 'superadmin') return; // SuperAdmin luôn giữ toàn quyền

    const currentList = globalPermissions[roleCode] || [];
    let updatedList;
    if (currentList.includes(permKey)) {
      updatedList = currentList.filter((k) => k !== permKey);
    } else {
      updatedList = [...currentList, permKey];
    }

    onChangeGlobalPermissions({
      ...globalPermissions,
      [roleCode]: updatedList,
    });
  };

  return (
    <Card
      title="4. Quản Trị Phân Quyền Vai Trò Toàn Hệ Thống (Global Permissions Matrix)"
      subtitle="Thiết lập các quyền hạn nền tảng cho từng vai trò trong Quỹ tín dụng nhân dân Yên Thọ"
      headerRight={
        <div className="flex items-center gap-2">
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

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Save}
            isLoading={isSaving}
            onClick={onSavePermissions}
            className="text-xs font-bold"
          >
            Lưu phân quyền chung
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 min-w-[220px]">Quyền hạn chung</th>
                <th className="py-2.5 px-3 min-w-[120px]">Phân loại</th>
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
              {GLOBAL_PERMISSIONS_CONFIG.map((perm) => (
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

                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                      {perm.category}
                    </span>
                  </td>

                  {SYSTEM_ROLES_LIST.map((role) => {
                    const isSuper = role.code === 'superadmin';
                    const rolePerms = globalPermissions[role.code] || [];
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

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0f766e] shrink-0" />
          <span>
            Phân quyền được lưu trữ trực tiếp trên Firestore và áp dụng tức thì cho tất cả các phiên làm việc của cán bộ khi đăng nhập.
          </span>
        </div>
      </div>
    </Card>
  );
};

export default React.memo(GlobalRolePermissionsSettings);
