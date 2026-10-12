/**
 * ============================================================================
 * BỘ TIỆN ÍCH XUẤT FILE DOANH NGHIỆP DÙNG CHUNG (ENTERPRISE EXPORT SUITE)
 * Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM Engine
 * ============================================================================
 * Hỗ trợ xuất 4 định dạng chuẩn mực toàn hệ thống:
 * 1. Excel (.xlsx): Bảng tính Microsoft Excel có định dạng, styling, auto-width, 100% tiếng Việt UTF-8
 * 2. Word (.docx): Văn bản Microsoft Word chuẩn thể thức hành chính Việt Nam (Quốc hiệu, Tiêu ngữ, Bảng kẻ viền, Khối chữ ký)
 * 3. PDF (.pdf): Tài liệu chuẩn in A4 KHÔNG LỖI FONT (Rasterized Vector Engine chống vỡ chữ tiếng Việt)
 * 4. PNG (.png): Ảnh chụp độ phân giải cao (Retina 2x) phục vụ báo cáo nhanh
 *
 * Tối ưu hóa:
 * - 100% Dynamic Import (Lazy Loading) cô lập trong chunk 'vendor-export'
 * - Không gây phình bundle tải trang ban đầu (Zero Performance Regression)
 */

import { formatDateVN } from './dateUtils';
import { calculatePositionTenure } from './evaluationUtils';

// Helper tải file Blob về máy client
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
};

/**
 * ----------------------------------------------------------------------------
 * 1. XUẤT FILE EXCEL THỰC THỤ (.xlsx)
 * ----------------------------------------------------------------------------
 * @param {Object} options
 * @param {string} options.filename - Tên file xuất (vd: "Ket_qua_tin_nhiem_2026.xlsx")
 * @param {string} options.sheetName - Tên sheet (vd: "Kết quả tín nhiệm")
 * @param {string} options.title - Tiêu đề văn bản lớn in hoa
 * @param {string} options.subtitle - Phụ đề hoặc phạm vi kỳ đánh giá
 * @param {string} options.orgName - Tên đơn vị (Mặc định: QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ)
 * @param {Array<string>} options.headers - Mảng tiêu đề cột ['STT', 'Họ và tên', ...]
 * @param {Array<Array<any>>} options.rows - Mảng 2 chiều chứa các dòng dữ liệu
 * @param {Array<number>} options.colWidths - Độ rộng tùy chọn cho các cột
 */
export const exportToExcel = async ({
  filename = 'Bao_cao_xuat.xlsx',
  sheetName = 'Báo cáo',
  title = 'BÁO CÁO TỔNG HỢP',
  subtitle = '',
  orgName = 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ',
  orgAddress = 'Thôn Tân Lộc, xã Quý Lộc, Thanh Hóa',
  headers = [],
  rows = [],
  colWidths = [],
}) => {
  try {
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Dòng 1: Tên đơn vị
    wsData.push([orgName.toUpperCase()]);
    // Dòng 2: Địa chỉ
    wsData.push([orgAddress]);
    wsData.push([]); // Dòng trống

    // Dòng 4: Tiêu đề chính
    wsData.push([title.toUpperCase()]);
    if (subtitle) {
      wsData.push([subtitle]);
    }
    wsData.push([]); // Dòng trống

    // Dòng bắt đầu bảng: Headers
    const headerRowIndex = wsData.length;
    wsData.push(headers);

    // Thêm các dòng dữ liệu
    rows.forEach((row) => {
      wsData.push(row);
    });

    // Thêm dòng chân trang ngày xuất
    wsData.push([]);
    const today = new Date();
    const dateStr = `Quý Lộc, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
    const dateRow = new Array(Math.max(headers.length - 2, 1)).fill('');
    dateRow.push(dateStr);
    wsData.push(dateRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Tính toán độ rộng cột (wch)
    const computedCols = headers.map((h, colIdx) => {
      if (colWidths[colIdx]) return { wch: colWidths[colIdx] };
      let maxLen = String(h || '').length;
      rows.forEach((r) => {
        const cellVal = String(r[colIdx] ?? '');
        if (cellVal.length > maxLen) {
          maxLen = cellVal.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 4, 10), 50) };
    });
    ws['!cols'] = computedCols;

    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    // Đảm bảo tên file có đuôi .xlsx
    const finalFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFileXLSX(wb, finalFilename);

    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Lỗi khi xuất file Excel (.xlsx):', error);
    throw error;
  }
};

/**
 * ----------------------------------------------------------------------------
 * 2. XUẤT FILE MICROSOFT WORD (.docx) CHUẨN THỂ THỨC HÀNH CHÍNH
 * ----------------------------------------------------------------------------
 * @param {Object} options
 * @param {string} options.filename - Tên file xuất
 * @param {string} options.title - Tiêu đề văn bản (vd: "BIÊN BẢN TỔNG HỢP KẾT QUẢ...")
 * @param {string} options.subtitle - Trích yếu hoặc thông tin kỳ
 * @param {string} options.orgName - Tên cơ quan ban hành
 * @param {string} options.docCode - Số hiệu văn bản
 * @param {Array<string>} options.headers - Mảng tiêu đề cột
 * @param {Array<Array<any>>} options.rows - Dữ liệu bảng
 * @param {Array<string>} options.signatures - Danh sách chức danh người ký
 */
export const exportToWord = async ({
  filename = 'Bien_ban_tong_hop.docx',
  title = 'BIÊN BẢN TỔNG HỢP KẾT QUẢ',
  subtitle = '',
  orgName = 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ',
  orgAddress = 'Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa',
  docCode = 'Số: ..... /BB-QTDYT',
  headers = [],
  rows = [],
  signatures = [
    { title: 'TRƯỞNG BAN KIỂM SOÁT', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'GIÁM ĐỐC ĐIỀU HÀNH', subtitle: '(Ký, ghi rõ họ tên)' },
    { title: 'CHỦ TỊCH HĐQT', subtitle: '(Ký, đóng dấu, ghi rõ họ tên)' }
  ],
}) => {
  try {
    const { 
      Document, 
      Packer, 
      Paragraph, 
      Table, 
      TableRow, 
      TableCell, 
      TextRun, 
      WidthType, 
      AlignmentType, 
      BorderStyle,
      HeightRule,
    } = await import('docx');

    const today = new Date();
    const dateStr = `Quý Lộc, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    // 1. Khối Header Quốc hiệu & Cơ quan (2 Cột căn chỉnh chuẩn hành chính)
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            // Cột Trái: Đơn vị
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: orgName.toUpperCase(), bold: true, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: orgAddress, size: 17, italics: true, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: docCode, bold: true, size: 18, font: 'Times New Roman' }),
                  ],
                }),
              ],
            }),
            // Cột Phải: Quốc hiệu & Tiêu ngữ
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, italics: true, size: 20, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: '-----------------------', size: 16, font: 'Times New Roman' }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: dateStr, italics: true, size: 19, font: 'Times New Roman' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    // 2. Tiêu đề văn bản
    const titleParagraphs = [
      new Paragraph({ text: '', spacing: { before: 200 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 26, // 13pt
            font: 'Times New Roman',
          }),
        ],
      }),
    ];

    if (subtitle) {
      titleParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: subtitle,
              italics: true,
              size: 21,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    } else {
      titleParagraphs.push(new Paragraph({ text: '', spacing: { after: 150 } }));
    }

    // 3. Bảng Dữ Liệu Kẻ Ô Chuẩn
    const borderStyleThin = { style: BorderStyle.SINGLE, size: 1, color: '888888' };
    const tableBorders = {
      top: borderStyleThin,
      bottom: borderStyleThin,
      left: borderStyleThin,
      right: borderStyleThin,
      insideHorizontal: borderStyleThin,
      insideVertical: borderStyleThin,
    };

    // Header Row
    const tableHeaderRow = new TableRow({
      tableHeader: true,
      children: headers.map((headerText) =>
        new TableCell({
          shading: { fill: 'F1F5F9' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: String(headerText), bold: true, size: 19, font: 'Times New Roman' }),
              ],
            }),
          ],
        })
      ),
    });

    // Data Rows
    const dataTableRows = rows.map((row) =>
      new TableRow({
        children: row.map((cellVal, colIdx) => {
          const isCenter = colIdx === 0 || colIdx >= row.length - 3;
          return new TableCell({
            children: [
              new Paragraph({
                alignment: isCenter ? AlignmentType.CENTER : AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: String(cellVal ?? ''),
                    size: 19,
                    font: 'Times New Roman',
                    bold: colIdx === 1,
                  }),
                ],
              }),
            ],
          });
        }),
      })
    );

    const dataTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: tableBorders,
      rows: [tableHeaderRow, ...dataTableRows],
    });

    // 4. Khối Chữ Ký Các Bên
    const sigCells = signatures.map((sig) =>
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: sig.title, bold: true, size: 20, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: sig.subtitle || '(Ký, họ tên)', italics: true, size: 17, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({ text: '', spacing: { before: 800 } }), // Khoảng trống ký tên
        ],
      })
    );

    const signatureTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: sigCells,
        }),
      ],
    });

    // Tạo Document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1134, // ~2cm
                bottom: 1134, // ~2cm
                left: 1417, // ~2.5cm
                right: 1134, // ~2cm
              },
            },
          },
          children: [
            headerTable,
            ...titleParagraphs,
            dataTable,
            new Paragraph({ text: '', spacing: { before: 300 } }),
            signatureTable,
          ],
        },
      ],
    });

    // Đóng gói blob và tải về
    const blob = await Packer.toBlob(doc);
    const finalFilename = filename.toLowerCase().endsWith('.docx') ? filename : `${filename}.docx`;
    downloadBlob(blob, finalFilename);

    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Lỗi khi xuất file Word (.docx):', error);
    throw error;
  }
};

/**
 * ----------------------------------------------------------------------------
 * 3. XUẤT FILE PDF CHUẨN A4 KHÔNG LỖI FONT (RASTERIZED VECTOR RENDERING)
 * ----------------------------------------------------------------------------
 * Giải pháp triệt để 100% không bao giờ bị lỗi font tiếng Việt:
 * Sử dụng html2canvas để render đúng font hệ thống, đưa vào jsPDF theo trang A4
 * @param {HTMLElement|string} elementOrId - Thẻ DOM hoặc ID của khối cần xuất PDF
 * @param {Object} options
 * @param {string} options.filename - Tên file PDF
 * @param {string} options.orientation - 'portrait' (dọc) hoặc 'landscape' (ngang)
 */
export const exportToPdfFromElement = async (
  elementOrId,
  {
    filename = 'Tai_lieu.pdf',
    orientation = 'portrait',
    scale = 2,
  } = {}
) => {
  try {
    const targetElement = typeof elementOrId === 'string' 
      ? document.getElementById(elementOrId) 
      : elementOrId;

    if (!targetElement) {
      throw new Error(`Không tìm thấy phần tử HTML để xuất PDF: ${elementOrId}`);
    }

    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = jsPDFModule;

    // 1. Chờ nạp xong toàn bộ fonts hệ thống và web fonts để chống lỗi vỡ chữ tiếng Việt
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }

    // 2. Chụp lại toàn bộ phần tử với độ nét cao 2x
    const canvas = await html2canvas(targetElement, {
      scale: scale || 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: targetElement.scrollWidth || 1024,
      onclone: (clonedDoc) => {
        const id = typeof elementOrId === 'string' ? elementOrId : targetElement.id;
        const clonedEl = id ? clonedDoc.getElementById(id) : null;
        if (clonedEl) {
          clonedEl.style.fontFamily = '"Times New Roman", "Be Vietnam Pro", serif';
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Kích thước trang A4 tính theo mm: 210 x 297 (dọc) hoặc 297 x 210 (ngang)
    const isPortrait = orientation === 'portrait';
    const pageWidth = isPortrait ? 210 : 297;
    const pageHeight = isPortrait ? 297 : 210;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Thêm trang đầu tiên
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Tự động phân chia trang nếu nội dung dài hơn 1 trang A4
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(finalFilename);

    return { success: true, filename: finalFilename };
  } catch (error) {
    console.error('Lỗi khi xuất file PDF:', error);
    throw error;
  }
};

/**
 * ----------------------------------------------------------------------------
 * 4. XUẤT ẢNH PNG ĐỘ NÉT CAO (.png)
 * ----------------------------------------------------------------------------
 * Phục vụ báo cáo nhanh qua Zalo, slide hoặc mạng xã hội
 */
export const exportToPng = async (
  elementOrId,
  {
    filename = 'Anh_bao_cao.png',
    scale = 2,
  } = {}
) => {
  try {
    const targetElement = typeof elementOrId === 'string' 
      ? document.getElementById(elementOrId) 
      : elementOrId;

    if (!targetElement) {
      throw new Error(`Không tìm thấy phần tử HTML để chụp ảnh: ${elementOrId}`);
    }

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }

    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const canvas = await html2canvas(targetElement, {
      scale: scale || 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: targetElement.scrollWidth || 1024,
      onclone: (clonedDoc) => {
        const id = typeof elementOrId === 'string' ? elementOrId : targetElement.id;
        const clonedEl = id ? clonedDoc.getElementById(id) : null;
        if (clonedEl) {
          clonedEl.style.fontFamily = '"Times New Roman", "Be Vietnam Pro", serif';
        }
      },
    });

    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Không thể tạo file ảnh');
      const finalFilename = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;
      downloadBlob(blob, finalFilename);
    }, 'image/png');

    return { success: true, filename };
  } catch (error) {
    console.error('Lỗi khi xuất ảnh PNG:', error);
    throw error;
  }
};

/**
 * ----------------------------------------------------------------------------
 * 5. XUẤT DANH BẠ TOÀN BỘ CÁN BỘ SANG MICROSOFT EXCEL (.xlsx)
 * ----------------------------------------------------------------------------
 */
export const exportEmployeesDirectoryToExcel = async (employees = []) => {
  const headers = [
    'STT',
    'Họ và tên',
    'Giới tính',
    'Ngày sinh',
    'Số CCCD',
    'Số điện thoại',
    'Hộp thư điện tử',
    'Phòng ban',
    'Chức danh công tác',
    'Ngày vào Quỹ',
    'Thâm niên công tác',
    'Đảng viên ĐCSVN',
    'Địa bàn phụ trách',
    'Trình độ chuyên môn',
  ];

  const rows = employees.map((emp, idx) => {
    const tenure = calculatePositionTenure(emp.joinDate);
    return [
      idx + 1,
      emp.name || '',
      emp.gender || 'Nam',
      emp.birthDate ? formatDateVN(emp.birthDate) : '',
      emp.cccd ? `'${emp.cccd}` : '',
      emp.phone ? `'${emp.phone}` : '',
      emp.email || '',
      emp.department || '',
      emp.position || '',
      emp.joinDate ? formatDateVN(emp.joinDate) : '',
      tenure,
      emp.partyMember ? 'Đảng viên chính thức' : 'Chưa kết nạp',
      emp.assignedArea || '',
      emp.education || '',
    ];
  });

  return await exportToExcel({
    filename: 'Danh_ba_can_bo_QTDND_Yen_Tho.xlsx',
    sheetName: 'Danh bạ cán bộ',
    title: 'DANH SÁCH CÁN BỘ NHÂN VIÊN',
    subtitle: 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ',
    headers,
    rows,
    colWidths: [6, 24, 10, 14, 16, 14, 26, 20, 24, 14, 18, 20, 28, 30],
  });
};

/**
 * ----------------------------------------------------------------------------
 * 6. XUẤT SƠ YẾU LÝ LỊCH TRÍCH NGANG CÁN BỘ SANG EXCEL (.xlsx) MẪU 2C/TCTD
 * ----------------------------------------------------------------------------
 */
export const exportEmployeeProfileToExcel = async (
  emp,
  workHistory = [],
  trainings = [],
  degrees = [],
  socials = []
) => {
  if (!emp) throw new Error('Không có thông tin cán bộ để xuất file Excel');

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const effectiveStart = emp.positionStartDate || emp.joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);
  const totalTenureText = calculatePositionTenure(emp.joinDate);

  const filteredHistory = workHistory.filter(
    (rec) => rec.employeeId === emp.id || rec.employeeUuid === emp.id || (rec.employeeCode && rec.employeeCode === emp.code)
  ).sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    const dateA = a.startDate || a.effectiveDate || '';
    const dateB = b.startDate || b.effectiveDate || '';
    return dateB.localeCompare(dateA);
  });

  const filteredDegrees = degrees.filter(
    (d) => d.employeeId === emp.id || d.employeeUuid === emp.id
  ).sort((a, b) => {
    if (a.isHighest && !b.isHighest) return -1;
    if (!a.isHighest && b.isHighest) return 1;
    const yearA = Number(a.graduationYear) || 0;
    const yearB = Number(b.graduationYear) || 0;
    return yearB - yearA;
  });

  const filteredSocials = socials.filter(
    (s) => s.employeeId === emp.id || s.employeeUuid === emp.id
  );

  const filteredTrainings = trainings.filter(
    (t) => t.employeeId === emp.id || (t.employeeCode && t.employeeCode === emp.code)
  );

  // --- SHEET 1: Trich_ngang_2C (Bản in trích ngang tổng hợp) ---
  const wsData = [];
  wsData.push(['QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ']);
  wsData.push(['Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa']);
  wsData.push([]);
  wsData.push(['SƠ YẾU LÝ LỊCH TRÍCH NGANG CÁN BỘ (MẪU 2C/TCTD)']);
  wsData.push(['Họ và tên:', emp.name ? emp.name.toUpperCase() : '']);
  wsData.push([]);

  wsData.push(['I. THÔNG TIN CÁ NHÂN & LIÊN HỆ']);
  wsData.push(['Họ và tên khai sinh:', emp.name, 'Giới tính:', emp.gender || 'Nam']);
  wsData.push(['Ngày sinh:', emp.birthDate ? formatDateVN(emp.birthDate) : '', 'Số CCCD:', emp.cccd ? `'${emp.cccd}` : '']);
  wsData.push(['Số điện thoại:', emp.phone ? `'${emp.phone}` : '', 'Hộp thư điện tử:', emp.email || '']);
  if (filteredSocials.length > 0) {
    const socSummary = filteredSocials.map((s) => `${s.platform}: ${s.accountName || s.username || ''}`).join('; ');
    wsData.push(['Kênh liên lạc mạng xã hội:', socSummary]);
  }
  wsData.push([]);

  wsData.push(['II. QUÁ TRÌNH CÔNG TÁC & VỊ TRÍ ĐẢM NHIỆM']);
  wsData.push(['Phòng ban công tác:', emp.department || '', 'Chức danh hiện tại:', emp.position || '']);
  wsData.push(['Ngày đảm nhiệm chức vụ:', effectiveStart ? formatDateVN(effectiveStart) : '', 'Thâm niên chức vụ:', tenureText]);
  wsData.push(['Ngày tuyển dụng vào Quỹ:', emp.joinDate ? formatDateVN(emp.joinDate) : '', 'Tổng thâm niên tại Quỹ:', totalTenureText]);
  wsData.push(['Loại hợp đồng lao động:', emp.contractType || 'Không xác định thời hạn', 'Địa bàn phụ trách:', emp.assignedArea || '']);
  wsData.push([]);

  wsData.push(['III. CHÍNH TRỊ & ĐẢNG - ĐOÀN THỂ']);
  wsData.push(['Tình trạng Đảng viên:', emp.partyMember ? 'Đảng viên chính thức' : 'Chưa kết nạp', 'Chức vụ Chi bộ:', emp.politicalRole || '—']);
  wsData.push(['Ngày vào Đảng dự bị:', emp.partyDate ? formatDateVN(emp.partyDate) : '', 'Ngày chính thức:', emp.partyOfficialDate ? formatDateVN(emp.partyOfficialDate) : '']);
  wsData.push([]);

  wsData.push(['IV. TRÌNH ĐỘ HỌC VẤN & VĂN BẰNG CHUYÊN MÔN']);
  wsData.push(['Trình độ chuyên môn tóm tắt:', emp.education || 'Đại học chuyên ngành']);
  wsData.push(['Tin học:', 'Ứng dụng CNTT cơ bản', 'Ngoại ngữ:', 'Tiếng Anh']);

  if (filteredDegrees.length > 0) {
    wsData.push([]);
    wsData.push(['DANH MỤC VĂN BẰNG CHUYÊN MÔN:']);
    wsData.push(['STT', 'Cấp bậc', 'Chuyên ngành đào tạo', 'Cơ sở đào tạo', 'Hình thức', 'Năm TN', 'Xếp loại', 'Số hiệu bằng']);
    filteredDegrees.forEach((deg, idx) => {
      wsData.push([
        idx + 1,
        deg.degreeLevel || 'Đại học',
        deg.major || '',
        deg.institution || '',
        deg.trainingType || 'Chính quy',
        deg.graduationYear || '',
        deg.classification || '',
        deg.degreeNumber ? `'${deg.degreeNumber}` : '',
      ]);
    });
  }

  if (filteredHistory.length > 0) {
    wsData.push([]);
    wsData.push(['V. QUÁ TRÌNH CÔNG TÁC & LUÂN CHUYỂN (TIMELINE)']);
    wsData.push(['STT', 'Từ ngày', 'Đến ngày / Hiện tại', 'Chức danh', 'Phòng ban', 'Địa bàn tín dụng', 'Hình thức', 'Số QĐ', 'Người ký']);
    filteredHistory.forEach((h, idx) => {
      const startText = h.startDate ? formatDateVN(h.startDate) : (h.effectiveDate ? formatDateVN(h.effectiveDate) : '');
      const endText = h.isCurrent ? 'Đến nay' : (h.endDate ? formatDateVN(h.endDate) : '');
      wsData.push([
        idx + 1,
        startText,
        endText,
        h.position || h.toPosition || emp.position,
        h.department || h.toDepartment || emp.department,
        h.assignedArea || h.toAssignedArea || '',
        h.transferType === 'LUAN_CHUYEN_DINH_KY' ? 'Luân chuyển định kỳ' : h.transferType === 'BO_NHIEM' ? 'Bổ nhiệm' : 'Điều động',
        h.decisionNumber || '',
        h.signer || '',
      ]);
    });
  }

  if (filteredTrainings.length > 0) {
    wsData.push([]);
    wsData.push(['VI. DANH MỤC KHÓA ĐÀO TẠO & BỒI DƯỠNG NGHIỆP VỤ']);
    wsData.push(['STT', 'Tên khóa học / Chứng chỉ', 'Cơ sở đào tạo', 'Số hiệu', 'Ngày cấp', 'Hạn hiệu lực', 'Xếp loại']);
    filteredTrainings.forEach((t, i) => {
      wsData.push([
        i + 1,
        t.courseName || '',
        t.institution || '',
        t.certificateNumber ? `'${t.certificateNumber}` : '',
        t.issueDate ? formatDateVN(t.issueDate) : '',
        t.expireDate ? formatDateVN(t.expireDate) : 'Vô thời hạn',
        t.grade || 'Đạt',
      ]);
    });
  }

  wsData.push([]);
  const today = new Date();
  wsData.push(['', '', '', `Quý Lộc, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`]);
  wsData.push(['NGƯỜI KHAI', '', '', 'CHỦ TỊCH HĐQT / GIÁM ĐỐC']);
  wsData.push([emp.name || '', '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 22 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Trich_ngang_2C');

  // --- SHEET 2: Qua_trinh_cong_tac (Chi tiết các mốc timeline) ---
  if (filteredHistory.length > 0) {
    const histData = [
      ['BẢNG CHI TIẾT QUÁ TRÌNH CÔNG TÁC & LUÂN CHUYỂN (TIMELINE)'],
      [`Cán bộ: ${emp.name} - ${emp.position} (${emp.department})`],
      [],
      ['STT', 'Từ ngày', 'Đến ngày', 'Hiện tại', 'Chức danh', 'Phòng ban', 'Địa bàn tín dụng', 'Hình thức điều động', 'Số Quyết định', 'Ngày ký', 'Người ký', 'Bàn giao', 'Ghi chú'],
    ];
    filteredHistory.forEach((h, idx) => {
      histData.push([
        idx + 1,
        h.startDate ? formatDateVN(h.startDate) : '',
        h.isCurrent ? 'Đến nay' : (h.endDate ? formatDateVN(h.endDate) : ''),
        h.isCurrent ? 'Đang đảm nhiệm' : 'Đã kết thúc',
        h.position || h.toPosition || emp.position,
        h.department || h.toDepartment || emp.department,
        h.assignedArea || h.toAssignedArea || '',
        h.transferType || '',
        h.decisionNumber || '',
        h.decisionDate ? formatDateVN(h.decisionDate) : '',
        h.signer || '',
        h.handoverStatus || '',
        h.notes || h.reason || '',
      ]);
    });
    const wsHist = XLSX.utils.aoa_to_sheet(histData);
    wsHist['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsHist, 'Qua_trinh_cong_tac');
  }

  // --- SHEET 3: Van_bang_chuyen_mon ---
  if (filteredDegrees.length > 0) {
    const degData = [
      ['BẢNG DANH MỤC VĂN BẰNG & TRÌNH ĐỘ CHUYÊN MÔN'],
      [`Cán bộ: ${emp.name} - ${emp.position}`],
      [],
      ['STT', 'Cấp bậc / Trình độ', 'Chuyên ngành đào tạo', 'Cơ sở / Trường đào tạo', 'Hình thức đào tạo', 'Năm tốt nghiệp', 'Xếp loại', 'Số hiệu bằng', 'Chuyên môn chính', 'Ghi chú'],
    ];
    filteredDegrees.forEach((deg, idx) => {
      degData.push([
        idx + 1,
        deg.degreeLevel || 'Đại học',
        deg.major || '',
        deg.institution || '',
        deg.trainingType || 'Chính quy',
        deg.graduationYear || '',
        deg.classification || '',
        deg.degreeNumber ? `'${deg.degreeNumber}` : '',
        deg.isHighest ? 'Chuyên môn chính' : '',
        deg.notes || '',
      ]);
    });
    const wsDeg = XLSX.utils.aoa_to_sheet(degData);
    wsDeg['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 28 }, { wch: 32 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsDeg, 'Van_bang_chuyen_mon');
  }

  // --- SHEET 4: Mang_xa_hoi ---
  if (filteredSocials.length > 0) {
    const socData = [
      ['BẢNG DANH MỤC KÊNH MẠNG XÃ HỘI & LIÊN LẠC SỐ'],
      [`Cán bộ: ${emp.name} - ${emp.phone || ''}`],
      [],
      ['STT', 'Nền tảng / Mạng xã hội', 'Tên tài khoản / Nickname', 'Đường dẫn liên kết (URL)', 'Công khai nội bộ', 'Ghi chú'],
    ];
    filteredSocials.forEach((soc, idx) => {
      socData.push([
        idx + 1,
        soc.platform || '',
        soc.accountName || soc.username || '',
        soc.url || '',
        soc.isPublic ? 'Công khai' : 'Nội bộ',
        soc.notes || '',
      ]);
    });
    const wsSoc = XLSX.utils.aoa_to_sheet(socData);
    wsSoc['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 26 }, { wch: 40 }, { wch: 16 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSoc, 'Mang_xa_hoi');
  }

  const cleanName = (emp.name || 'Can_bo').replace(/\s+/g, '_');
  const filename = `Trich_ngang_2C_${cleanName}.xlsx`;
  XLSX.writeFileXLSX(wb, filename);
  return { success: true, filename };
};

/**
 * ----------------------------------------------------------------------------
 * 7. XUẤT TRÍCH NGANG CÁN BỘ SANG MICROSOFT WORD (.docx) CHUẨN MẪU 2C/TCTD
 * ----------------------------------------------------------------------------
 */
export const exportEmployeeProfileToDocx = async (
  emp,
  workHistory = [],
  trainings = [],
  degrees = [],
  socials = []
) => {
  if (!emp) throw new Error('Không có thông tin cán bộ để xuất file Word');

  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    WidthType,
    AlignmentType,
    BorderStyle,
  } = await import('docx');

  const effectiveStart = emp.positionStartDate || emp.joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);
  const totalTenureText = calculatePositionTenure(emp.joinDate);
  const today = new Date();
  const dateStr = `Quý Lộc, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  const filteredHistory = workHistory.filter(
    (rec) => rec.employeeId === emp.id || rec.employeeUuid === emp.id || (rec.employeeCode && rec.employeeCode === emp.code)
  ).sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    const dateA = a.startDate || a.effectiveDate || '';
    const dateB = b.startDate || b.effectiveDate || '';
    return dateB.localeCompare(dateA);
  });

  const filteredDegrees = degrees.filter(
    (d) => d.employeeId === emp.id || d.employeeUuid === emp.id
  ).sort((a, b) => {
    if (a.isHighest && !b.isHighest) return -1;
    if (!a.isHighest && b.isHighest) return 1;
    const yearA = Number(a.graduationYear) || 0;
    const yearB = Number(b.graduationYear) || 0;
    return yearB - yearA;
  });

  const filteredSocials = socials.filter(
    (s) => s.employeeId === emp.id || s.employeeUuid === emp.id
  );

  // 1. Header Table: Cơ quan & Quốc hiệu
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ', bold: true, size: 20, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa', size: 17, italics: true, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Số: ....../TCTD-YT', size: 18, font: 'Times New Roman' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 20, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, italics: true, size: 20, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '-----------------------', size: 16, font: 'Times New Roman' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: dateStr, italics: true, size: 19, font: 'Times New Roman' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 2. Tiêu đề
  const titleParagraphs = [
    new Paragraph({ text: '', spacing: { before: 200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: 'SƠ YẾU LÝ LỊCH TRÍCH NGANG CÁN BỘ',
          bold: true,
          size: 28,
          font: 'Times New Roman',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: '(Mẫu 2C/TCTD - Báo cáo nội bộ & Ngân hàng Nhà nước)',
          italics: true,
          size: 20,
          font: 'Times New Roman',
        }),
      ],
    }),
  ];

  // Helper paragraph
  const makeSectionHeading = (title) =>
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({ text: title, bold: true, size: 22, font: 'Times New Roman' }),
      ],
    });

  const makeInfoLine = (label, val, boldVal = false) =>
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({ text: label, size: 20, font: 'Times New Roman' }),
        new TextRun({ text: ` ${val || '—'}`, bold: boldVal, size: 20, font: 'Times New Roman' }),
      ],
    });

  const contentParagraphs = [
    makeSectionHeading('I. THÔNG TIN CÁ NHÂN & LIÊN HỆ'),
    makeInfoLine('1. Họ và tên khai sinh:', emp.name ? emp.name.toUpperCase() : '—', true),
    makeInfoLine('2. Giới tính:', emp.gender || 'Nam'),
    makeInfoLine('3. Ngày, tháng, năm sinh:', emp.birthDate ? formatDateVN(emp.birthDate) : '—'),
    makeInfoLine('4. Số Thẻ CCCD:', emp.cccd || '—', true),
    makeInfoLine('5. Số điện thoại liên hệ:', emp.phone || '—'),
    makeInfoLine('6. Hộp thư điện tử (Email):', emp.email || '—'),
  ];

  if (filteredSocials.length > 0) {
    const socSummary = filteredSocials.map((s) => `${s.platform}: ${s.accountName || s.username || ''}`).join(' • ');
    contentParagraphs.push(makeInfoLine('7. Kênh mạng xã hội / Liên hệ số:', socSummary));
  }

  contentParagraphs.push(
    makeSectionHeading('II. QUÁ TRÌNH CÔNG TÁC & VỊ TRÍ ĐẢM NHIỆM'),
    makeInfoLine('1. Phòng ban công tác:', emp.department || '—', true),
    makeInfoLine('2. Chức vụ hiện tại:', emp.position || '—', true),
    makeInfoLine('3. Ngày đảm nhiệm chức vụ:', effectiveStart ? formatDateVN(effectiveStart) : '—'),
    makeInfoLine('4. Thâm niên công tác tại vị trí hiện tại:', tenureText, true),
    makeInfoLine('5. Ngày tuyển dụng vào Quỹ:', emp.joinDate ? formatDateVN(emp.joinDate) : '—'),
    makeInfoLine('6. Tổng thâm niên công tác tại Quỹ:', totalTenureText),
    makeInfoLine('7. Loại hợp đồng lao động:', emp.contractType || 'Không xác định thời hạn'),
    makeInfoLine('8. Địa bàn phụ trách tín dụng:', emp.assignedArea || 'Chưa phân công địa bàn'),

    makeSectionHeading('III. CHÍNH TRỊ & ĐẢNG - ĐOÀN THỂ'),
    makeInfoLine('1. Tình trạng Đảng viên ĐCSVN:', emp.partyMember ? 'Đảng viên chính thức' : 'Chưa kết nạp', true),
    makeInfoLine('2. Chức vụ Chi bộ:', emp.politicalRole || '—'),
    makeInfoLine('3. Ngày kết nạp Đảng dự bị:', emp.partyDate ? formatDateVN(emp.partyDate) : '—'),
    makeInfoLine('4. Ngày công nhận chính thức:', emp.partyOfficialDate ? formatDateVN(emp.partyOfficialDate) : '—'),

    makeSectionHeading('IV. TRÌNH ĐỘ HỌC VẤN & VĂN BẰNG CHUYÊN MÔN'),
    makeInfoLine('1. Trình độ chuyên môn tóm tắt:', emp.education || 'Đại học chuyên ngành', true),
    makeInfoLine('2. Lý luận chính trị:', 'Sơ cấp / Trung cấp'),
    makeInfoLine('3. Quản lý Nhà nước / Nghiệp vụ Quỹ TDND:', 'Đã hoàn thành bồi dưỡng theo tiêu chuẩn NHNN')
  );

  // Bảng văn bằng chuyên môn nếu có
  let degreeSection = [];
  if (filteredDegrees.length > 0) {
    const borderThin = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
    const dBorders = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin, insideHorizontal: borderThin, insideVertical: borderThin };

    const degHeader = new TableRow({
      tableHeader: true,
      children: ['STT', 'Cấp bậc', 'Chuyên ngành đào tạo', 'Cơ sở đào tạo', 'Hình thức', 'Năm TN', 'Xếp loại'].map((h) =>
        new TableCell({
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, font: 'Times New Roman' })] })]
        })
      )
    });

    const degRows = filteredDegrees.map((deg, i) =>
      new TableRow({
        children: [
          String(i + 1),
          deg.degreeLevel || 'Đại học',
          deg.major || '—',
          deg.institution || '—',
          deg.trainingType || 'Chính quy',
          deg.graduationYear ? String(deg.graduationYear) : '—',
          deg.classification || '—',
        ].map((c, colIdx) =>
          new TableCell({
            children: [new Paragraph({ alignment: colIdx === 0 || colIdx === 1 || colIdx === 4 || colIdx === 5 || colIdx === 6 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: String(c), size: 18, font: 'Times New Roman' })] })]
          })
        )
      })
    );

    degreeSection = [
      new Paragraph({ text: '', spacing: { before: 80 } }),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: dBorders, rows: [degHeader, ...degRows] }),
    ];
  }

  // Bảng quá trình điều động luân chuyển nếu có
  let historySection = [];
  if (filteredHistory.length > 0) {
    const borderThin = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
    const hBorders = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin, insideHorizontal: borderThin, insideVertical: borderThin };

    const histHeader = new TableRow({
      tableHeader: true,
      children: ['STT', 'Thời gian', 'Chức danh đảm nhiệm', 'Phòng ban', 'Địa bàn quản lý', 'Số QĐ'].map((h) =>
        new TableCell({
          shading: { fill: 'E2E8F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 18, font: 'Times New Roman' })] })]
        })
      )
    });

    const histRows = filteredHistory.map((item, idx) => {
      const startText = item.startDate ? formatDateVN(item.startDate) : (item.effectiveDate ? formatDateVN(item.effectiveDate) : '—');
      const endText = item.isCurrent ? 'Đến nay' : (item.endDate ? formatDateVN(item.endDate) : '—');
      return new TableRow({
        children: [
          String(idx + 1),
          `${startText} - ${endText}`,
          item.position || item.toPosition || emp.position || '—',
          item.department || item.toDepartment || emp.department || '—',
          item.assignedArea || item.toAssignedArea || '—',
          item.decisionNumber || '—'
        ].map((c, i) =>
          new TableCell({
            children: [new Paragraph({ alignment: i === 0 || i === 1 || i === 5 ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: String(c), size: 18, font: 'Times New Roman' })] })]
          })
        )
      });
    });

    historySection = [
      makeSectionHeading('V. QUÁ TRÌNH CÔNG TÁC & LUÂN CHUYỂN (TIMELINE)'),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: hBorders, rows: [histHeader, ...histRows] }),
    ];
  }

  // Khối chữ ký 3 bên
  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'NGƯỜI KHAI', bold: true, size: 20, font: 'Times New Roman' })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, size: 18, font: 'Times New Roman' })] }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: emp.name || '', bold: true, size: 20, font: 'Times New Roman' })] }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BỘ PHẬN TỔ CHỨC / KIỂM SOÁT', bold: true, size: 20, font: 'Times New Roman' })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true, size: 18, font: 'Times New Roman' })] }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TRƯỞNG BKS', bold: true, size: 20, font: 'Times New Roman' })] }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CHỦ TỊCH HĐQT / GIÁM ĐỐC', bold: true, size: 20, font: 'Times New Roman' })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '(Ký, đóng dấu, ghi rõ họ tên)', italics: true, size: 18, font: 'Times New Roman' })] }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CHỦ TỊCH HĐQT', bold: true, size: 20, font: 'Times New Roman' })] }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1417, right: 1134 },
          },
        },
        children: [
          headerTable,
          ...titleParagraphs,
          ...contentParagraphs,
          ...degreeSection,
          ...historySection,
          new Paragraph({ text: '', spacing: { before: 300 } }),
          sigTable,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = (emp.name || 'Can_bo').replace(/\s+/g, '_');
  const filename = `Trich_ngang_2C_${cleanName}.docx`;
  downloadBlob(blob, filename);
  return { success: true, filename };
};

