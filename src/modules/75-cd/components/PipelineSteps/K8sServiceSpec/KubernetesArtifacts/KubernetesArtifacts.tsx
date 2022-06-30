/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { KubernetesArtifactsProps } from '../K8sServiceSpecInterface'
import { KubernetesPrimaryArtifacts } from './KubernetesPrimaryArtifacts/KubernetesPrimaryArtifacts'
import { KubernetesSidecarArtifacts } from './KubernetesSidecarArtifacts/KubernetesSidecarArtifacts'

export const KubernetesArtifacts: React.FC<KubernetesArtifactsProps> = props => {
  const commonProps = {
    template: props.template,
    artifacts: props.artifacts,
    artifactSourceBaseFactory: props.artifactSourceBaseFactory,
    stepViewType: props.stepViewType,
    stageIdentifier: props.stageIdentifier,
    serviceIdentifier: props.serviceIdentifier,
    formik: props.formik,
    path: props.path,
    initialValues: props.initialValues,
    readonly: props.readonly,
    allowableTypes: props.allowableTypes,
    fromTrigger: props.fromTrigger,
    artifact: props.artifact
  }
  return (
    <>
      <KubernetesPrimaryArtifacts type={props.type} {...commonProps} />
      <KubernetesSidecarArtifacts {...commonProps} />
    </>
  )
}
