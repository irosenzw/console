import { k8sGet } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { getVMTemplateNamespacedName } from '../selectors/vm-template/selectors';
import { VMKind } from '../types';
import { K8sResourceCommon } from '../../../../public/module/k8s/index';

export const onSecretWorkloadChange = async (vm: K8sResourceCommon): Promise<K8sResourceCommon> => {
  const tmpltObj = getVMTemplateNamespacedName(vm as VMKind);
  const template = tmpltObj ? await k8sGet(TemplateModel, tmpltObj.name, tmpltObj.namespace) : null;

  return template;
};
