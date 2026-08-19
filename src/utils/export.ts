/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLXS from 'xlsx';

export const exportToXlxs = (data: any[], title: string) => {
  const worksheet = XLXS.utils.json_to_sheet(data);
  const workbook = XLXS.utils.book_new();

  XLXS.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const excelBuffer = XLXS.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title}.xlsx`;
  link.click();
};
