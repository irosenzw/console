export enum DiskSourceLabel {
  AttachDisk = 'Use an existing PVC',
  AttachClonedDisk = 'Clone an existing PVC',
  Blank = 'Blank',
  Container = 'Container',
  URL = 'Upload via URL',
  Import = 'Import an existing PVC',
}

export enum DiskSourceTitle {
  Blank = 'Blank',
  URL = 'URL',
  Container = 'Container',
  AttachClonedDisk = 'Attach Cloned Disk',
  AttachDisk = 'Attach Disk',
  ImportDisk = 'Import Disk',
  Other = 'Other',
}
