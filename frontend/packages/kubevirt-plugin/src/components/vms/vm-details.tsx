import * as React from 'react';
import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
  FirehoseResult,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { getNamespace } from '@console/shared';
import { K8sKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import { ServicesList } from '@console/internal/components/service';
import { VMKind, VMIKind } from '../../types';
import { getLoadedData, getResource } from '../../utils';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { getServicesForVmi } from '../../selectors/service';
import { VMResourceSummary, VMDetailsList, VMSchedulingList } from './vm-resource';
import { VMTabProps, IsPendingChange } from './types';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMStatusBundle } from '../../statuses/vm/types';
import { isVM, isVMI } from '../../selectors/check-type';
import { detectNextRunChanges } from './utils';
import { Alert, AlertVariant, List, ListItem, Button } from '@patternfly/react-core';

import './vm-details.scss';

export const VMDetailsFirehose: React.FC<VMTabProps> = ({
  obj: objProp,
  vm: vmProp,
  vmis: vmisProp,
  vmImports,
  pods,
  migrations,
  templates,
  dataVolumes,
  customData: { kindObj },
}) => {
  const vm =
    kindObj === VirtualMachineModel && isVM(objProp) ? objProp : isVM(vmProp) ? vmProp : null;
  const vmi =
    kindObj === VirtualMachineInstanceModel && isVMI(objProp)
      ? objProp
      : isVMI(vmisProp[0])
      ? vmisProp[0]
      : null;

  const resources = [
    getResource(ServiceModel, { namespace: getNamespace(objProp), prop: 'services' }),
  ];

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    dataVolumes,
    vmImports,
  });

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMDetails
          kindObj={kindObj}
          vm={vm}
          vmi={vmi}
          pods={pods}
          templates={templates}
          vmStatusBundle={vmStatusBundle}
        />
      </Firehose>
    </div>
  );
};

export const VMDetails: React.FC<VMDetailsProps> = (props) => {
  const { kindObj, vm, vmi, pods, vmStatusBundle, templates, ...restProps } = props;
  const [openBootOrderModal, setOpenBootOrderModal] = React.useState(false);
  const [openCDROMModal, setOpenCDROMModal] = React.useState(false);
  const [openFlavorModal, setOpenFlavorModal] = React.useState(false);

  const vmiLike = kindObj === VirtualMachineModel ? vm : vmi;
  const vmServicesData = getServicesForVmi(getLoadedData(props.services, []), vmi);
  const canUpdate = useAccessReview(asAccessReview(kindObj, vmiLike || {}, 'patch')) && !!vmiLike;
  const vmConfChanges = detectNextRunChanges(vm, vmi);
  const isVMRequireRestart = !!vmi && Object.values(vmConfChanges).some((x) => !!x);

  const openModal = (key) => {
    switch (key) {
      case IsPendingChange.flavor:
        setOpenFlavorModal(true);
        return;
      case IsPendingChange.cdroms:
        setOpenCDROMModal(true);
        return;
      case IsPendingChange.bootOrder:
        setOpenBootOrderModal(true);
        break;
      default:
        break;
    }
  };

  return (
    <StatusBox data={vmiLike} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text={`${kindObj.label} Details`} />
        {isVMRequireRestart && (
          <Alert
            title="Pending Changes"
            isInline
            variant={AlertVariant.warning}
            className="kubevirt-vm-details__pending-changes-class-alert"
          >
            <List>
              {Object.keys(vmConfChanges).map(
                (key) =>
                  vmConfChanges[key] && (
                    <ListItem key={key}>
                      <Button onClick={() => openModal(key)} isInline variant="link">
                        {key}
                      </Button>
                    </ListItem>
                  ),
              )}
            </List>
          </Alert>
        )}
        <div className="row">
          <div className="col-sm-6">
            <VMResourceSummary
              kindObj={kindObj}
              canUpdateVM={canUpdate}
              vm={vm}
              vmi={vmi}
              templates={templates}
            />
          </div>
          <div className="col-sm-6">
            <VMDetailsList
              kindObj={kindObj}
              canUpdateVM={canUpdate}
              vm={vm}
              vmi={vmi}
              pods={pods}
              vmStatusBundle={vmStatusBundle}
              openBootOrderModal={openBootOrderModal}
              openCDROMModal={openCDROMModal}
              setOpenBootOrderModal={setOpenBootOrderModal}
              setOpenCDROMModal={setOpenCDROMModal}
            />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Scheduling and resources requirements" />
        <div className="row">
          <VMSchedulingList
            kindObj={kindObj}
            canUpdateVM={canUpdate}
            vm={vm}
            vmi={vmi}
            openFlavorModal={openFlavorModal}
            setOpenFlavorModal={setOpenFlavorModal}
          />
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Services" />
        <ServicesList {...restProps} data={vmServicesData} label="Services" />
      </div>
    </StatusBox>
  );
};

type VMDetailsProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  services?: FirehoseResult;
  templates?: TemplateKind[];
  vmStatusBundle?: VMStatusBundle;
};
