type ConflictBehaviour = 'fail' | 'replace' | 'rename'

interface TaskInputs {
  tenantId: string
  clientId: string
  clientSecret: string
  driveId: string
  targetFolder: string
  sourceFolder: string
  contents: string
  conflictBehaviour: ConflictBehaviour
  cleanTargetFolder: boolean
  flattenFolders: boolean
}

const TaskInputNames = {
  tenantId: 'tenant-id',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  driveId: 'drive-id',
  targetFolder: 'target-folder',
  sourceFolder: 'source-folder',
  contents: 'contents',
  conflictBehaviour: 'conflict-behaviour',
  cleanTargetFolder: 'clean-target-folder',
  flattenFolders: 'flatten-folders'
};

export { ConflictBehaviour, TaskInputs, TaskInputNames };
