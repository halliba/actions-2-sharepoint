import * as core from '@actions/core';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import fs from 'fs';
import { printProgress } from './utils';
import { ConflictBehaviour } from './task-inputs';
import { createClient, IAuthOptions } from './auth';

interface UploaderOptions {
  auth: IAuthOptions
  conflictBehaviour: ConflictBehaviour
}

class Uploader {
  private _options: UploaderOptions;
  private _client?: MicrosoftGraph.Client;

  constructor(options: UploaderOptions) {
    this._options = options;
  }

  async getClientAsync(): Promise<MicrosoftGraph.Client> {
    if (this._client) {
      return this._client;
    }

    const client = createClient(this._options.auth);

    this._client = client;
    return client;
  }

  static constructFileUrl(
    driveId: string,
    fileName: string,
    path = '/'
  ): string {
    const pathComponents = path.split('/').concat(fileName.split('/'));

    const encodedPath = pathComponents
      .map(p => encodeURIComponent(p))
      .filter(p => p !== '')
      .join('/');

    return `/drives/${driveId}/root:/${encodedPath}`;
  }

  async uploadFileAsync(
    localFilePath: string,
    driveId: string,
    remotePath: string,
    remoteFileName: string
  ): Promise<MicrosoftGraph.UploadResult | null> {
    const client = await this.getClientAsync();

    const requestUrl = `${Uploader.constructFileUrl(
      driveId,
      remoteFileName,
      remotePath
    )}:/createUploadSession`;

    const fileStats = fs.statSync(localFilePath);
    const fileSize = fileStats.size;

    if (fileSize === 0) {
      const byte0Msg = `SharePoint Online does not support 0-Byte files: '${localFilePath}'.`;
      core.warning(byte0Msg);

      return null;
    }

    const payload = {
      item: {
        '@microsoft.graph.conflictBehavior': this._options.conflictBehaviour,
        name: remoteFileName
      },
      deferCommit: fileSize === 0
    };

    const readStream = fs.createReadStream(localFilePath);
    const fileObject = new MicrosoftGraph.StreamUpload(
      readStream,
      remoteFileName,
      fileSize
    );

    const uploadSession =
      await MicrosoftGraph.LargeFileUploadTask.createUploadSession(
        client,
        requestUrl,
        payload
      );

    const uploadTask = new MicrosoftGraph.LargeFileUploadTask(
      client,
      fileObject,
      uploadSession
    );

    const uploadedFile = await uploadTask.upload();
    return uploadedFile;
  }

  async cleanFolderAsync(driveId: string, remotePath: string): Promise<void> {
    core.info(`Cleaning target folder ${remotePath}'.`);

    const client = await this.getClientAsync();

    const folderUrl = Uploader.constructFileUrl(driveId, '', remotePath);

    let result: any;
    try {
      result = await client
        .api(`${folderUrl}:/children?$select=name,id,folder`)
        .get();
    } catch (error: unknown) {
      if ((error as any).statusCode !== 404) {
        throw error;
      }
    }

    if (!result || !result.value) return;

    const items = result.value as DriveItem[];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      printProgress(
        items.length,
        i,
        `Deleting '${item.folder ? `${item.name}/` : item.name}'`
      );

      const itemUrl = `/drives/${driveId}/items/${item.id}`;
      await client.api(itemUrl).delete();
    }
  }
}

export default Uploader;
