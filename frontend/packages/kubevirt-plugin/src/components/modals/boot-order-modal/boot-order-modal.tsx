import * as React from 'react';
import * as _ from 'lodash';
import { Modal, Button, ButtonVariant } from '@patternfly/react-core';
import { createBasicLookup } from '@console/shared/src';
import { withHandlePromise, HandlePromiseProps } from '@console/internal/components/utils';
import { ModalComponentProps } from '@console/internal/components/factory';
import { k8sPatch } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import { BootableDeviceType } from '../../../types';
import { VMLikeEntityKind } from '../../../types/vmLike';
import {
  getVMLikeModel,
  getDevices,
  getBootableDevices,
  asVM,
  isVMRunningOrExpectedRunning,
} from '../../../selectors/vm';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { BootOrder, deviceKey } from '../../boot-order';
import { DeviceType } from '../../../constants';
import { ModalFooter } from '../modal/modal-footer';
import { PendingChangesAlert } from '../../../selectors/vm-like/nextRunChanges';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { confirmVMIModal } from '../menu-actions-modals/confirm-vmi-modal';
import { getActionMessage } from '../../vms/constants';
import { VMActionType, restartVM } from '../../../k8s/requests/vm/actions';

import './boot-order-modal.scss';

const modalTitle = 'Virtual machine boot order';

const BootOrderModalComponent = ({
  vmLikeEntity,
  isOpen,
  setOpen,
  title = modalTitle,
  handlePromise,
  inProgress,
  errorMessage,
}: BootOrderModalProps) => {
  const [devices, setDevices] = React.useState<BootableDeviceType[]>(
    getBootableDevices(vmLikeEntity),
  );
  const [initialDeviceList, setInitialDeviceList] = React.useState<BootableDeviceType[]>(
    getBootableDevices(vmLikeEntity),
  );
  const [showUpdatedAlert, setUpdatedAlert] = React.useState<boolean>(false);
  const [showPatchError, setPatchError] = React.useState<boolean>(false);
  const vm = asVM(vmLikeEntity);
  const { vmi } = React.useContext(VMDashboardContext);

  const onReload = React.useCallback(() => {
    const updatedDevices = getBootableDevices(vmLikeEntity);

    setInitialDeviceList(updatedDevices);
    setDevices(updatedDevices);
    setUpdatedAlert(false);
    setPatchError(false);
  }, [vmLikeEntity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inform user on vmLikeEntity.
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Compare only bootOrder from initialDeviceList to current device list.
    const devicesMap = createBasicLookup(getBootableDevices(vmLikeEntity), deviceKey);
    const updated =
      initialDeviceList.length &&
      initialDeviceList.some((d) => {
        // Find the initial device in the updated list.
        const device = devicesMap[deviceKey(d)];

        // If a device bootOrder changed, or it was deleted, set alert.
        return !device || device.value.bootOrder !== d.value.bootOrder;
      });

    setUpdatedAlert(updated);
  }, [vmLikeEntity]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-set device list on isOpen change to true.
  React.useEffect(() => {
    if (isOpen) {
      onReload();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveChanges = () => {
    // Copy only bootOrder from devices to current device list.
    const currentDevices = _.cloneDeep(getDevices(vmLikeEntity));
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
    const patches = [
      new PatchBuilder('/spec/template/spec/domain/devices/disks').replace(disks).build(),
      new PatchBuilder('/spec/template/spec/domain/devices/interfaces').replace(interfaces).build(),
    ];
    const promise = k8sPatch(
      getVMLikeModel(vmLikeEntity),
      vmLikeEntity,
      getVMLikePatches(vmLikeEntity, () => patches),
    );

    handlePromise(promise)
      .then(() => setOpen(false))
      .catch(() => setPatchError(true));
  };

  // Send new bootOrder to k8s.
  const onSubmit = async (event) => {
    event.preventDefault();
    saveChanges();
  };

  const footer = (
    <ModalFooter
      errorMessage={showPatchError && errorMessage}
      inProgress={inProgress}
      isSaveAndRestart={isVMRunningOrExpectedRunning(vm)}
      onSubmit={onSubmit}
      onCancel={() => setOpen(false)}
      submitButtonText="Save"
      infoTitle={showUpdatedAlert && 'Boot order has been updated outside this flow.'}
      infoMessage={
        <>
          Saving these changes will override any boot order previously saved.
          <br />
          To see the updated order{' '}
          <Button variant={ButtonVariant.link} isInline onClick={onReload}>
            reload the content
          </Button>
          .
        </>
      }
      className={'kubevirt-boot-order-modal__footer'}
      onSaveAndRestart={() => {
        confirmVMIModal({
          vmi,
          title: 'Restart Virtual Machine',
          alertTitle: 'Restart Virtual Machine alert',
          message: getActionMessage(vm, VMActionType.Restart),
          btnText: _.capitalize(VMActionType.Restart),
          executeFn: () => {
            saveChanges();
            return restartVM(vm);
          },
          cancel: () => saveChanges(),
        });
      }}
    />
  );

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      description={isVMRunningOrExpectedRunning(asVM(vmLikeEntity)) && <PendingChangesAlert />}
      variant="small"
      onClose={() => setOpen(false)}
      footer={footer}
      showClose={false}
    >
      <BootOrder devices={devices} setDevices={setDevices} />
    </Modal>
  );
};

export type BootOrderModalProps = HandlePromiseProps &
  ModalComponentProps & {
    vmLikeEntity: VMLikeEntityKind;
    title?: string;
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
  };

export const BootOrderModal = withHandlePromise(BootOrderModalComponent);
