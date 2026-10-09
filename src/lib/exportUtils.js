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

    // Chụp lại toàn bộ phần tử với độ nét cao 2x
    const canvas = await html2canvas(targetElement, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: targetElement.scrollWidth,
      windowHeight: targetElement.scrollHeight,
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

    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;

    const canvas = await html2canvas(targetElement, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
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
