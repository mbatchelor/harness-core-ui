/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepWizard, Icon, MultiTypeInputType } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import { String, StringKeys, useStrings } from 'framework/strings'
import { ArtifactoryRepoType } from '../ArtifactRepository/ArtifactoryRepoType'
import { ArtifactConnector } from '../ArtifactRepository/ArtifactConnector'
import type { InitialArtifactDataType, ConnectorRefLabelType, ArtifactType } from '../ArtifactInterface'
import { ArtifactTitleIdByType } from '../ArtifactHelper'
import css from './ArtifactWizard.module.scss'

interface StepChangeData<SharedObject> {
  prevStep?: number
  nextStep?: number
  prevStepData: SharedObject
}
interface ArtifactWizardProps {
  handleViewChange: (isConnectorView: boolean) => void
  artifactInitialValue: InitialArtifactDataType
  types: Array<ArtifactType>
  lastSteps: JSX.Element
  newConnectorSteps?: any
  expressions: string[]
  labels: ConnectorRefLabelType
  selectedArtifact: ArtifactType | null
  changeArtifactType: (data: ArtifactType | null) => void
  newConnectorView: boolean
  iconsProps: IconProps | undefined
  isReadonly: boolean
  allowableTypes: MultiTypeInputType[]
  showConnectorStep: boolean
}

function ArtifactWizard({
  types,
  labels,
  expressions,
  allowableTypes,
  selectedArtifact,
  changeArtifactType,
  handleViewChange,
  artifactInitialValue,
  newConnectorView,
  newConnectorSteps,
  lastSteps,
  iconsProps,
  showConnectorStep,
  isReadonly
}: ArtifactWizardProps): React.ReactElement {
  const { getString } = useStrings()

  const onStepChange = (arg: StepChangeData<any>): void => {
    if (arg?.prevStep && arg?.nextStep && arg.prevStep > arg.nextStep && arg.nextStep <= 2) {
      handleViewChange(false)
    }
  }

  const renderSubtitle = (): JSX.Element | undefined => {
    const stringId = selectedArtifact && ArtifactTitleIdByType[selectedArtifact]
    if (selectedArtifact) {
      return (
        <div className={css.subtitle} style={{ display: 'flex' }}>
          <Icon size={26} {...(iconsProps as IconProps)} />
          <String
            style={{ alignSelf: 'center', marginLeft: 'var(--spacing-small)' }}
            stringID={stringId as StringKeys}
          />
        </div>
      )
    }
    return undefined
  }
  return (
    <StepWizard className={css.existingDocker} subtitle={renderSubtitle()} onStepChange={onStepChange}>
      <ArtifactoryRepoType
        artifactTypes={types}
        name={getString('connectors.artifactRepoType')}
        stepName={labels.firstStepName}
        selectedArtifact={selectedArtifact}
        artifactInitialValue={artifactInitialValue}
        changeArtifactType={changeArtifactType}
      />
      {showConnectorStep && (
        <ArtifactConnector
          name={getString('connectors.artifactRepository')}
          stepName={labels.secondStepName}
          expressions={expressions}
          isReadonly={isReadonly}
          handleViewChange={() => handleViewChange(true)}
          initialValues={artifactInitialValue}
          selectedArtifact={selectedArtifact}
          allowableTypes={allowableTypes}
        />
      )}

      {newConnectorView ? newConnectorSteps : null}
      {lastSteps}
    </StepWizard>
  )
}

export default ArtifactWizard
