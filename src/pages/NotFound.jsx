import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0f766e] flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">404</h2>
        <h3 className="text-base font-bold text-slate-800 mb-2">
          Không Tìm Thấy Trang Yêu Cầu
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Đường dẫn không tồn tại hoặc bạn không có quyền truy cập vào nội dung này.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/portal" className="w-full sm:w-auto">
            <Button variant="primary" icon={ArrowLeft} className="w-full">
              Về Cổng Phân Hệ
            </Button>
          </Link>
          <Link to="/trust" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Phân Hệ Đánh Giá
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
