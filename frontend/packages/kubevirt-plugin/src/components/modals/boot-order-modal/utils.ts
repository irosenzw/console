import { VMLikeEntityKind } from '../../../types/vmLike';
import { deviceKey } from '../../boot-order/constants';
import { getDevices } from '../../../selectors/vm';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import * as _ from 'lodash';
import { DeviceType } from '../../../constants/vm/constants';
import { PatchBuilder } from '@console/shared/src/k8s/patch';
import { VMIKind } from '../../../types/vm';
import { getVMIDevices } from '../../../selectors/vmi';
import { Patch } from '@console/internal/module/k8s/types';

export const changeBootOrderPatches = (vmLikeEntity: VMLikeEntityKind, vmi?: VMIKind): Patch[] => {
  const devices = vmi ? getVMIDevices(vmi) : getDevices(vmLikeEntity);

  // Copy only bootOrder from devices to current device list.
  const currentDevices = _.cloneDeep(devices);
  const devicesMap = createBasicLookup(currentDevices, deviceKey);
  devices.forEach((d) => {
    // Find the device to update.
    const device = devicesMap[deviceKey(d)];

    // Update device bootOrder.
    if (device && d.value.bootOrder) {
      device.value.bootOrder = d.value.bootOrder;
    }
    if (device && device.value.bootOrder && !d.value.bootOrder) {
      delete device.value.bootOrder;
    }
  });

  // Filter disks and interfaces from devices list.
  const disks = [
    ...currentDevices
      .filter((source) => source.type === DeviceType.DISK)
      .map((source) => source.value),
  ];
  const interfaces = [
    ...currentDevices
      .filter((source) => source.type === DeviceType.NIC)
      .map((source) => source.value),
  ];

  // Patch k8s.
  return [
    new PatchBuilder('/spec/template/spec/domain/devices/disks').replace(disks).build(),
    new PatchBuilder('/spec/template/spec/domain/devices/interfaces').replace(interfaces).build(),
  ];
};
