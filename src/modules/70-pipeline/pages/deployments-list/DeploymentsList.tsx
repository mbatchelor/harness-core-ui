/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { HarnessDocTooltip } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps } from '@blueprintjs/core'

import { useStrings } from 'framework/strings'
import PipelineDeploymentList from '@pipeline/pages/pipeline-deployment-list/PipelineDeploymentList'
import PipelineModalListView from '@pipeline/components/PipelineModalListView/PipelineModalListView'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { Page } from '@common/exports'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import type { StringsMap } from 'stringTypes'
import css from './DeploymentsList.module.scss'

export default function DeploymentsList(): React.ReactElement {
  const { projectIdentifier, orgIdentifier, accountId, module } = useParams<PipelineType<ProjectPathProps>>()
  const { getString } = useStrings()

  useDocumentTitle([getString('pipelines'), getString('executionsText')])

  const runPipelineDialogProps: IDialogProps = {
    isOpen: true,
    enforceFocus: false,
    style: { minWidth: 800, minHeight: 280, backgroundColor: 'var(--grey-50)' }
  }

  const [openModal, hideModal] = useModalHook(
    () => (
      <Dialog {...runPipelineDialogProps}>
        <PipelineModalListView onClose={hideModal} />
      </Dialog>
    ),
    [projectIdentifier, orgIdentifier, accountId]
  )

  let textIdentifier: keyof StringsMap
  switch (module) {
    case 'ci':
      textIdentifier = 'buildsText'
      break
    case 'sto':
      textIdentifier = 'common.purpose.sto.continuous'
      break
    default:
      textIdentifier = 'deploymentsText'
  }

  return (
    <div className={css.main}>
      <Page.Header
        title={
          <div className="ng-tooltip-native">
            <h2 data-tooltip-id={textIdentifier}>{getString(textIdentifier)}</h2>
            <HarnessDocTooltip tooltipId={textIdentifier} useStandAlone={true} />
          </div>
        }
        breadcrumbs={<NGBreadcrumbs links={[]} />}
      ></Page.Header>
      <div>
        <PipelineDeploymentList onRunPipeline={openModal} />
      </div>
    </div>
  )
}
