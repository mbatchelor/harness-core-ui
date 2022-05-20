/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { get } from 'lodash-es'
import { getMultiTypeFromValue, MultiTypeInputType } from '@wings-software/uicore'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import { shouldRenderRunTimeInputView } from '@pipeline/utils/CIUtils'
import { Connectors } from '@connectors/constants'
import type { ECRStepProps } from '../ECRStep/ECRStep'
import type { GCRStepProps } from '../GCRStep/GCRStep'
import type { DockerHubStepProps } from '../DockerHubStep/DockerHubStep'
import { CIStepOptionalConfig } from './CIStepOptionalConfig'

interface ArtifactStepCommonProps extends Omit<ECRStepProps | GCRStepProps | DockerHubStepProps, 'initialValues'> {
  artifactConnectorType: ConnectorInfoDTO['type']
}

export const ArtifactStepCommon: React.FC<ArtifactStepCommonProps> = ({
  template,
  path,
  readonly,
  stepViewType,
  formik,
  artifactConnectorType
}) => {
  return (
    <CIStepOptionalConfig
      stepViewType={stepViewType}
      readonly={readonly}
      enableFields={{
        ...(artifactConnectorType === Connectors.AWS &&
          shouldRenderRunTimeInputView(get(template, 'spec.baseImageConnectorRefs')) && {
            'spec.baseImageConnectorRefs': {
              type: [Connectors.DOCKER]
            }
          }),
        ...(shouldRenderRunTimeInputView(template?.spec?.tags) && {
          'spec.tags': {}
        }),
        ...(getMultiTypeFromValue(template?.spec?.optimize) === MultiTypeInputType.RUNTIME && {
          'spec.optimize': {}
        }),
        ...(getMultiTypeFromValue(template?.spec?.dockerfile) === MultiTypeInputType.RUNTIME && {
          'spec.dockerfile': {}
        }),
        ...(getMultiTypeFromValue(template?.spec?.context) === MultiTypeInputType.RUNTIME && {
          'spec.context': {}
        }),
        ...(shouldRenderRunTimeInputView(template?.spec?.labels) && {
          'spec.labels': {}
        }),
        ...(shouldRenderRunTimeInputView(template?.spec?.buildArgs) && {
          'spec.buildArgs': {}
        }),
        ...(getMultiTypeFromValue(template?.spec?.target) === MultiTypeInputType.RUNTIME && {
          'spec.target': {}
        }),
        ...(getMultiTypeFromValue(
          get(
            template?.spec,
            [Connectors.AWS, Connectors.GCP].includes(artifactConnectorType) ? 'remoteCacheImage' : ''
          )
        ) === MultiTypeInputType.RUNTIME && {
          'spec.remoteCacheImage': {}
        }),
        ...(getMultiTypeFromValue(
          get(template?.spec, artifactConnectorType === Connectors.DOCKER ? 'remoteCacheRepo' : '')
        ) === MultiTypeInputType.RUNTIME && {
          'spec.remoteCacheRepo': {}
        })
      }}
      path={path || ''}
      formik={formik}
      isInputSetView={true}
      template={template}
    />
  )
}
