import * as _ from 'lodash';
import { BootableDeviceType, V1NetworkInterface } from '../../types';
import { getBootableDisks, getInterfaces } from './selectors';
import { asVM } from './vmlike';
import { VMLikeEntityKind } from '../../types/vmLike';
import { V1Disk } from '../../types/vm/disk/V1Disk';
import { DeviceType } from '../../constants';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';

export const getBootDeviceIndex = (devices, bootOrder) =>
  devices.findIndex((device) => device.bootOrder === bootOrder);

export const getDeviceBootOrder = (device, defaultValue?): number =>
  device && device.bootOrder === undefined ? defaultValue : device.bootOrder;

export const transformDevices = (
  disks: V1Disk[] = [],
  nics: V1NetworkInterface[] = [],
): BootableDeviceType[] => {
  const transformedDisks = disks.map((disk) => ({
    type: DeviceType.DISK,
    typeLabel: new DiskWrapper(disk).getType().toString(),
    value: disk,
  }));
  const transformedNics = nics.map((nic) => ({
    type: DeviceType.NIC,
    typeLabel: 'NIC',
    value: nic,
  }));

  return [...transformedDisks, ...transformedNics];
};
export const getDevices = (vmLikeEntity: VMLikeEntityKind): BootableDeviceType[] => {
  const vm = asVM(vmLikeEntity);
  return transformDevices(getBootableDisks(vm), getInterfaces(vm));
};

export const getBootableDevices = (vm: VMLikeEntityKind): BootableDeviceType[] => {
  const devices = getDevices(vm).filter((device) => device.value.bootOrder);
  return [...devices];
};

export const getBootableDevicesInOrder = (vm: VMLikeEntityKind): BootableDeviceType[] =>
  _.sortBy(getBootableDevices(vm), 'value.bootOrder');

export const getNonBootableDevices = (vm: VMLikeEntityKind): BootableDeviceType[] => {
  const devices = getDevices(vm).filter((device) => !device.value.bootOrder);
  return [...devices];
};
