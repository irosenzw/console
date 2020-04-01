import { Extension } from './base';
import { K8sResourceCommon, TemplateKind, Patch } from '@console/internal/module/k8s';

namespace ExtensionProperties {
  export interface SecretExtention {
    onSecretWorkloadChange: (vm: K8sResourceCommon) => Promise<K8sResourceCommon>;
    getEnvDiskSerial: (vm: K8sResourceCommon, secretName: string) => string;
    getVMEnvDiskPatches: (
      vmObj: K8sResourceCommon,
      sourceName: string,
      sourceKind: string,
      serialNumber: string,
      vmTemplate?: TemplateKind,
    ) => Patch[];
  }
}

export interface SecretExtention extends Extension<ExtensionProperties.SecretExtention> {
  type: 'Secret/SecretExtenion';
}

export const isSecretExtension = (e: Extension): e is SecretExtention =>
  e.type === 'Secret/SecretExtenion';
