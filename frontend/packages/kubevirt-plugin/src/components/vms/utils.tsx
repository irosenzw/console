import * as React from 'react';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import * as _ from 'lodash';
import { getPVCSourceByDisk } from '../../selectors/vm/selectors';
import { getVMIPVCSourceByDisk } from '../../selectors/vmi/selectors';
import { BootableDeviceType } from '../../types/types';
import { IsPendingChange } from './types';
import { VMKind, VMIKind } from '../../types/vm';
import { Alert, AlertVariant } from '@patternfly/react-core';

import './utils.scss';
import { MODAL_RESTART_IS_REQUIRED } from '../../strings/vm/status';

export const isFlavorChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (!vm || !vmi) {
    return false;
  }

  return vm.getFlavor() !== vmi.getFlavor();
};

export const isCDROMChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (!vm || !vmi) {
    return false;
  }

  const vmPVCs: string[] = vm
    .getCDROMs()
    .map((cd) => getPVCSourceByDisk(vm.getVMObj(), cd.name))
    .sort();

  const vmiPVCs: string[] = vmi
    .getCDROMs()
    .map((cd) => getVMIPVCSourceByDisk(vmi.getVMIObj(), cd.name))
    .sort();

  if (vmiPVCs.length === 0) {
    return false;
  }

  if (vmPVCs.length !== vmiPVCs.length) {
    return true;
  }

  return !vmPVCs.every((value, index) => value === vmiPVCs[index]);
};

export const isBootOrderChanged = (vm: VMWrapper, vmi: VMIWrapper): boolean => {
  if (!vm || !vmi) {
    return false;
  }

  const vmBootOrder: BootableDeviceType[] = _.sortBy(
    vm.getLabeledDevices().filter((dev) => dev.value.bootOrder),
    'value.bootOrder',
  );

  const vmiBootOrder: BootableDeviceType[] = _.sortBy(
    vmi.getLabeledDevices().filter((dev) => dev.value.bootOrder),
    'value.bootOrder',
  );

  if (vmiBootOrder.length === 0) {
    return false;
  }

  if (vmBootOrder.length !== vmiBootOrder.length) {
    return true;
  }

  return !vmBootOrder.every(
    (device, index) =>
      device.type === vmiBootOrder[index].type &&
      device.typeLabel === vmiBootOrder[index].typeLabel &&
      device.value.bootOrder === vmiBootOrder[index].value.bootOrder &&
      device.value.name === vmiBootOrder[index].value.name,
  );
};

export const detectNextRunChanges = (vm: VMKind, vmi: VMIKind) => {
  const vmWrapper = new VMWrapper(vm);
  const vmiWrapper = new VMIWrapper(vmi);

  return {
    [IsPendingChange.flavor]: !!vmi && isFlavorChanged(vmWrapper, vmiWrapper),
    [IsPendingChange.cdroms]: !!vmi && isCDROMChanged(vmWrapper, vmiWrapper),
    [IsPendingChange.bootOrder]: !!vmi && isBootOrderChanged(vmWrapper, vmiWrapper),
  };
};

export const pendingChangesAlert = () => (
  <Alert
    title="Pending Changes"
    isInline
    variant={AlertVariant.info}
    className="kubevirt-vm-details__restart_required-class-alert"
  >
    {MODAL_RESTART_IS_REQUIRED}
  </Alert>
);
