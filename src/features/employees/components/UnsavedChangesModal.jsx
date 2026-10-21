import React from 'react';
import { AlertTriangle, Save, RotateCcw, X, ArrowRight } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';

/**
 * UnsavedChangesModal: Hộp Thoại Cảnh Báo & Xử Lý Thay Đổi Chưa Lưu
 * - Tự động phát hiện khi cán bộ có dữ liệu chỉnh sửa nhưng chưa lưu vào CSDL
 * - Cung cấp 3 lựa chọn hành động rõ ràng:
 *   1. Lưu & Tiếp tục (Primary)
 *   2. Bỏ qua thay đổi (Discard)
 *   3. Tiếp tục chỉnh sửa (Cancel/Stay)
 * - Hiển thị chi tiết danh sách các trường vừa bị thay đổi
 */
const UnsavedChangesModal = ({
  isOpen,
  employeeName = '',
  currentSection = '',
  targetSection = '',
  dirtyFields = [],
  onSave,
  onDiscard,
  onCancel,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-md"
      title="Phát hiện thay đổi chưa lưu"
      subtitle="Quỹ Tín Dụng Nhân Dân Yên Thọ • Quản trị hồ sơ cán bộ"
    >
      <div className="space-y-4">
        {/* Banner cảnh báo */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950 text-sm">
              Bạn có {dirtyFields.length} thông tin chưa được lưu!
            </p>
            <p className="text-amber-800 leading-relaxed">
              Hồ sơ của cán bộ <strong className="text-slate-900">{employeeName || 'đang chọn'}</strong>{' '}
              {currentSection ? (
                <>tại mục <strong className="text-emerald-950">{currentSection}</strong> </>
              ) : null}
              có dữ liệu vừa chỉnh sửa.
              {targetSection ? (
                <> Bạn có muốn lưu trước khi chuyển sang mục <strong className="text-slate-900">{targetSection}</strong> không?</>
              ) : (
                ' Bạn có muốn lưu các thay đổi này vào cơ sở dữ liệu không?'
              )}
            </p>
          </div>
        </div>

        {/* Danh sách các trường dữ liệu bị thay đổi */}
        {dirtyFields.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>Các trường đã chỉnh sửa ({dirtyFields.length})</span>
              <span className="text-slate-400 font-normal">Trước → Sau</span>
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 space-y-1.5 text-xs divide-y divide-slate-100">
              {dirtyFields.map((item, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-800 shrink-0 text-[11px]">
                    {item.label}:
                  </span>
                  <div className="text-right text-[11px] truncate max-w-[200px]">
                    <span className="line-through text-slate-400 mr-1">
                      {String(item.from || '(Trống)')}
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="font-bold text-emerald-800 ml-1">
                      {String(item.to || '(Trống)')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Các nút hành động */}
        <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Tiếp tục chỉnh sửa
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDiscard}
            disabled={isSaving}
            className="w-full sm:w-auto text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Bỏ qua thay đổi</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu & Tiếp tục'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UnsavedChangesModal;
