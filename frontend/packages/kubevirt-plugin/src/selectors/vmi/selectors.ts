import { getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../models';
import { getConsoleAPIBase } from '../../utils/url';
import { VMIKind } from '../../types/vm';
import * as _ from 'lodash';
import { getVolumePersistentVolumeClaimName } from '../vm/volume';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { getVMIVolumes, getVMIDisks } from './basic';

export const getVMISubresourcePath = () =>
  `${getConsoleAPIBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${VirtualMachineInstanceModel.apiVersion}/namespaces/${getNamespace(vmi)}/${
    VirtualMachineInstanceModel.plural
  }/${getName(vmi)}`;

export const getVMIPVCSourceByDisk = (vmi: VMIKind, diskName: string) =>
  getVolumePersistentVolumeClaimName(getVMIVolumes(vmi).find((vol) => vol.name === diskName));

export const getVMIBootableDisks = (vmi: VMIKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  getVMIDisks(vmi, defaultValue).filter((disk) => !Object.keys(disk).includes('serial'));
