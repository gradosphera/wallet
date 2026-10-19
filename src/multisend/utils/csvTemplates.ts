/* eslint-disable @stylistic/max-len */
export const MIXED_TRANSFERS_TEMPLATE = `UQDrfMm6HY2ZwfxBQwe3goundDZAv41A-peaWVmATQxPZiOE,1,usdt,Перевод USDT по тикеру
EQBHOTYvmKd4SQoaw_X90qRNCCIoQKnt_H9zY_AJ3lyVjqw3,2,toncoin,Перевод Gram по названию
UQAIsixsrb93f9kDyplo_bK5OdgW5r0WCcIJZdGOUG1B25BX,3000000000,EQCWDj49HFInSwSk49eAo476E1YBywLoFuSZ6OO3x7jmP2jn,Перевод BabyDoge по адресу
0:32c9d384057fcc41dfb1cab0e0f40a316a7eee4b97954bbe575f14a853ab0068,4000,BLG,Перевод Благо по адресу
gradosphera.ton,5,BLG,Благо для gradosphera.ton
`;
/* eslint-enable @stylistic/max-len */

export function generateTemplateDownloadUrl(template: string): string {
  const blob = new Blob([template], { type: 'text/csv' });
  return URL.createObjectURL(blob);
}

export function downloadTemplate(template: string, fileName = 'multi_transfer_template.csv'): void {
  const url = generateTemplateDownloadUrl(template);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
