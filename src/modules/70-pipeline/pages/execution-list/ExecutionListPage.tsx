/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { HarnessDocTooltip } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { Page } from '@common/exports'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import type { StringsMap } from 'stringTypes'
import css from './ExecutionListPage.module.scss'
import { ExecutionListTable } from './ExecutionListTable/ExecutionListTable'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'

export function ExecutionList(): React.ReactElement {
  const { module } = useParams<PipelineType<ProjectPathProps>>()
  const { getString } = useStrings()
  useDocumentTitle([getString('pipelines'), getString('executionsText')])

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
    <GitSyncStoreProvider>
      <Page.Header
        title={
          <div className="ng-tooltip-native">
            <h2 data-tooltip-id={textIdentifier}>{getString(textIdentifier)}</h2>
            <HarnessDocTooltip tooltipId={textIdentifier} useStandAlone={true} />
          </div>
        }
        breadcrumbs={<NGBreadcrumbs links={[]} />}
      />
      <Page.SubHeader>
        <ExecutionListSubHeader />
      </Page.SubHeader>

      <ExecutionListTable />
    </GitSyncStoreProvider>
  )
}
