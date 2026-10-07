// Danh mục Hằng số & Phân loại Chuẩn mực Quỹ TDND Yên Thọ
// Áp dụng Chính sách Không sử dụng Dữ liệu Giả lập (Zero Mock Data Policy)

export const ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  CHAIRMAN: 'chairman',
};

export const ROLE_LABELS = {
  [ROLES.STAFF]: 'Cán bộ nhân viên',
  [ROLES.MANAGER]: 'Ban Điều hành & BKS',
  [ROLES.CHAIRMAN]: 'Hội đồng Quản trị',
};

export const DEPARTMENTS = [
  'Hội đồng Quản trị',
  'Ban Kiểm soát',
  'Ban Điều hành',
  'Phòng Tín dụng',
  'Phòng Kế toán - Ngân quỹ',
];

export const PLANNING_POSITIONS = [
  'Chủ tịch Hội đồng Quản trị',
  'Thành viên HĐQT chuyên trách',
  'Trưởng Ban Kiểm soát',
  'Giám đốc điều hành',
  'Phó Giám đốc phụ trách Tín dụng',
  'Kế toán trưởng',
];

export const TRUST_CRITERIA_DEFAULT = [
  { id: 1, code: 'TC01', title: '1. Tinh thần trách nhiệm & Đạo đức nghề nghiệp', description: 'Gương mẫu, tận tụy với công việc, trung thực, liêm chính.' },
  { id: 2, code: 'TC02', title: '2. Chấp hành Quy chế, Nội quy & Pháp luật NHNN', description: 'Tuân thủ tuyệt đối quy trình nghiệp vụ và pháp luật ngân hàng.' },
  { id: 3, code: 'TC03', title: '3. Năng lực chuyên môn & Nghiệp vụ chuyên sâu', description: 'Nắm vững chính sách, xử lý công việc chính xác, an toàn.' },
  { id: 4, code: 'TC04', title: '4. Tác phong giao dịch & Văn hóa phục vụ thành viên', description: 'Chu đáo, tôn trọng, giữ gìn uy tín Quỹ tín dụng nhân dân.' },
  { id: 5, code: 'TC05', title: '5. Tinh thần đoàn kết & Phối hợp phòng ban', description: 'Tương trợ đồng nghiệp, phối hợp nhịp nhàng giữa các bộ phận.' },
  { id: 6, code: 'TC06', title: '6. Kỷ luật giờ giấc & Bảo mật thông tin tài chính', description: 'Nghiêm túc chấp hành kỷ luật lao động và an toàn thông tin.' },
  { id: 7, code: 'TC07', title: '7. Đổi mới sáng tạo & Chuyển đổi số', description: 'Tích cực ứng dụng công nghệ, cải tiến quy trình công tác.' },
  { id: 8, code: 'TC08', title: '8. Liêm chính tài chính & Phòng ngừa rủi ro đạo đức', description: 'Không vụ lợi, không bao che sai phạm, phòng ngừa rủi ro.' },
  { id: 9, code: 'TC09', title: '9. Đóng góp phong trào & Văn hóa tổ chức', description: 'Tham gia sôi nổi các hoạt động đoàn thể, văn thể mỹ của Quỹ.' },
  { id: 10, code: 'TC10', title: '10. Hiệu quả hoàn thành chỉ tiêu công việc', description: 'Mức độ hoàn thành kế hoạch được giao theo tiến độ và chất lượng.' },
];
