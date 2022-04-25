import * as core from '@actions/core';
import Uploader from './uploader';
import glob from 'glob';
import path from 'path';
import { TaskInputNames, TaskInputs, ConflictBehaviour } from './task-inputs';
import { printProgress } from './utils';

async function getSourceFilesAsync(
  sourceFolder: string,
  contents: string
): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const options: glob.IOptions = {
      cwd: sourceFolder,
      nodir: true
    };

    glob(contents, options, (err, matches) => {
      if (err) {
        reject(err);
      }

      resolve(matches);
    });
  });
}

function readInputs(): TaskInputs {
  return {
    tenantId: core.getInput(TaskInputNames.tenantId, { required: true })!,
    clientId: core.getInput(TaskInputNames.clientId, { required: true })!,
    clientSecret: core.getInput(TaskInputNames.clientSecret, { required: true })!,
    driveId: core.getInput(TaskInputNames.driveId, { required: true })!,
    targetFolder:
      core.getInput(TaskInputNames.targetFolder, { required: false }) ?? '',
    sourceFolder:
      core.getInput(TaskInputNames.sourceFolder, { required: false }) ?? '',
    contents: core.getInput(TaskInputNames.contents, { required: true })!,
    conflictBehaviour: core.getInput(TaskInputNames.conflictBehaviour, {
      required: true
    }) as ConflictBehaviour,
    cleanTargetFolder:
      core.getInput(TaskInputNames.cleanTargetFolder, { required: true }) ===
      'true',
    flattenFolders:
      core.getInput(TaskInputNames.flattenFolders, { required: true }) === 'true'
  };
}

async function processFilesAsync(
  uploader: Uploader,
  files: string[],
  inputs: TaskInputs
) {
  const fileCount = files.length;
  if (fileCount === 0) return;

  core.info(`Copying files to ${inputs.targetFolder}'`);

  for (let i = 0; i < fileCount; i++) {
    const localRelativeFilePath = files[i];

    const localAbsoluteFilePath = path.join(
      inputs.sourceFolder,
      localRelativeFilePath
    );

    let remoteRelativePath: string;
    if (inputs.flattenFolders) {
      remoteRelativePath = '';
    } else {
      remoteRelativePath = path.dirname(localRelativeFilePath);
    }

    const remoteFileName = path.basename(localRelativeFilePath);
    const remoteAbsolutePath = path.join(
      inputs.targetFolder,
      remoteRelativePath
    );

    printProgress(
      fileCount,
      i,
      `Copying '${localRelativeFilePath}' -> '${path.join(
        remoteAbsolutePath,
        remoteFileName
      )}'`
    );

    await uploader.uploadFileAsync(
      localAbsoluteFilePath,
      inputs.driveId,
      remoteAbsolutePath,
      remoteFileName
    );
  }
}

async function runTaskAsync(): Promise<void> {
  const inputs = readInputs();

  const files = await getSourceFilesAsync(inputs.sourceFolder, inputs.contents);
  core.info(`Found ${files.length} files in '${inputs.sourceFolder}'.`);

  const uploader = new Uploader({
    auth: {
      clientId: inputs.clientId,
      clientSecret: inputs.clientSecret,
      tenantId: inputs.tenantId
    },
    conflictBehaviour: inputs.conflictBehaviour
  });

  if (inputs.cleanTargetFolder) {
    await uploader.cleanFolderAsync(inputs.driveId, inputs.targetFolder);
  }

  await processFilesAsync(uploader, files, inputs);
}

export { runTaskAsync };
