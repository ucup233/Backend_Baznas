import ExcelJS from 'exceljs';

const exportToExcel = async (res, { sheetName, columns, rows, filename, totalAvailable, exported, isTruncated }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    ...columns
  ];

  sheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' }
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  rows.forEach((row, index) => {
    sheet.addRow({ no: index + 1, ...row.toJSON() });
  });

  if (isTruncated) {
    sheet.addRow({});
    const infoRow = sheet.addRow({});
    infoRow.getCell(2).value = `⚠ Data terpotong: menampilkan ${exported} dari ${totalAvailable} total data.`;
    infoRow.getCell(2).font = { italic: true, color: { argb: 'FFFF0000' } };
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);

  await workbook.xlsx.write(res);
  res.end();
};

export default exportToExcel;
