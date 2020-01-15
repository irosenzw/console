import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  ProjectModel,
  StorageClassModel,
} from '@console/internal/models';
import { TemplateValidations } from 'packages/kubevirt-plugin/src/utils/validations/template/template-validations';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import {
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
  VMWizardStorageWithWrappers,
} from '../../types';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { getStoragesWithWrappers, getTemplateValidations } from '../../selectors/selectors';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskModal } from '../../../modals/disk-modal';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
import { PersistentVolumeClaimWrapper } from '../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';

const VMWizardStorageModal: React.FC<VMWizardStorageModalProps> = (props) => {
  const {
    storage,
    isCreateTemplate,
    isEditing,
    namespace: vmNamespace,
    useProjects,
    addUpdateStorage,
    storages,
    templateValidations,
    ...restProps
  } = props;
  const {
    type,
    diskWrapper = DiskWrapper.EMPTY,
    volumeWrapper = VolumeWrapper.EMPTY,
    dataVolumeWrapper,
    persistentVolumeClaimWrapper,
    ...storageRest
  } = storage || {};

  const filteredStorages = storages.filter(
    (s) => s && s.diskWrapper.getName() && s.diskWrapper.getName() !== diskWrapper.getName(),
  );

  const usedDiskNames: Set<string> = new Set(
    filteredStorages.map(({ diskWrapper: dw }) => dw.getName()),
  );

  const usedPVCNames: Set<string> = new Set(
    filteredStorages
      .filter(({ dataVolume }) => dataVolume)
      .map(({ dataVolumeWrapper: dvw }) => dvw.getName()),
  );

  const [namespace, setNamespace] = React.useState<string>(vmNamespace);

  const resources = [
    {
      kind: (useProjects ? ProjectModel : NamespaceModel).kind,
      isList: true,
      prop: 'namespaces',
    },
    {
      kind: StorageClassModel.kind,
      isList: true,
      prop: 'storageClasses',
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'persistentVolumeClaims',
    },
  ];

  const getAllowedBusses = (): Set<string> => {
    // Empty Set means all values are excepted
    return new Set(
      templateValidations.reduce(
        (result: string[], tv: TemplateValidations) =>
          result.concat(Array.from(tv.getAllowedBusses())),
        [],
      ),
    );
  };

  return (
    <Firehose resources={resources}>
      <DiskModal
        {...restProps}
        vmName={VM_TEMPLATE_NAME_PARAMETER}
        vmNamespace={vmNamespace}
        namespace={namespace}
        onNamespaceChanged={(n) => setNamespace(n)}
        usedDiskNames={usedDiskNames}
        usedPVCNames={usedPVCNames}
        disk={diskWrapper}
        volume={volumeWrapper}
        dataVolume={dataVolumeWrapper}
        persistentVolumeClaim={persistentVolumeClaimWrapper}
        disableSourceChange={[
          VMWizardStorageType.PROVISION_SOURCE_DISK,
          VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
        ].includes(type)}
        isCreateTemplate={isCreateTemplate}
        isEditing={isEditing}
        allowedBusses={getAllowedBusses()}
        onSubmit={(
          resultDiskWrapper,
          resultVolumeWrapper,
          resultDataVolumeWrapper,
          resultPersistentVolumeClaim,
        ) => {
          addUpdateStorage({
            ...storageRest,
            type: type || VMWizardStorageType.UI_INPUT,
            disk: DiskWrapper.mergeWrappers(diskWrapper, resultDiskWrapper).asResource(),
            volume: VolumeWrapper.mergeWrappers(volumeWrapper, resultVolumeWrapper).asResource(),
            dataVolume:
              resultDataVolumeWrapper &&
              DataVolumeWrapper.mergeWrappers(
                dataVolumeWrapper,
                resultDataVolumeWrapper,
              ).asResource(),
            persistentVolumeClaim:
              resultPersistentVolumeClaim &&
              PersistentVolumeClaimWrapper.mergeWrappers(
                persistentVolumeClaimWrapper,
                resultPersistentVolumeClaim,
              ).asResource(),
          });
          return Promise.resolve();
        }}
      />
    </Firehose>
  );
};

type VMWizardStorageModalProps = ModalComponentProps & {
  isEditing?: boolean;
  storage?: VMWizardStorageWithWrappers;
  namespace: string;
  useProjects?: boolean;
  isCreateTemplate: boolean;
  storages: VMWizardStorageWithWrappers[];
  templateValidations: TemplateValidations[];
  addUpdateStorage: (storage: VMWizardStorage) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  const useProjects = state.k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
    namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
    isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
    storages: getStoragesWithWrappers(state, wizardReduxID),
    templateValidations: getTemplateValidations(state, wizardReduxID),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  addUpdateStorage: (storage: VMWizardStorage) => {
    dispatch(vmWizardActions[ActionType.UpdateStorage](wizardReduxID, storage));
  },
});

const VMWizardStorageModalConnected = connect(
  stateToProps,
  dispatchToProps,
)(VMWizardStorageModal);

export const vmWizardStorageModalEnhanced = createModalLauncher(VMWizardStorageModalConnected);
