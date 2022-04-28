import * as core from '@actions/core';

const printProgress = (totalItems: number, index: number, message: string) => {
  const padSize = totalItems.toString().length;
  core.info(
    `[${(index + 1).toString().padStart(padSize, '0')}` +
      `/${totalItems}] ${message}`
  );
};

export { printProgress };
