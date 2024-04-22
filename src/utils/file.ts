export const formatBytes = (
  bytes?: number | null,
  decimals: number = 2,
): string => {
  if (!bytes || bytes === 0) {
    return '0 Bytes';
  }

  const k: number = 1024;
  const dm: number = decimals < 0 ? 0 : decimals;
  const sizes: string[] = [
    'Bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB',
    'EB',
    'ZB',
    'YB',
  ];

  const i: number = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const isTypeImage = (type: string): boolean => {
  return type.includes('image');
};

export const findFileSize = (bytes: number): number => {
  if (bytes === 0) {
    return 0;
  }
  return bytes / (1024 * 1024);
};
