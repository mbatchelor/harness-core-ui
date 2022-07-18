/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { Button, ButtonVariation, Checkbox, ExpandingSearchInput, Layout, Text } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { String, useStrings } from 'framework/strings'
import type { PipelinePathProps, PipelineType } from '@common/interfaces/RouteInterfaces'

import StatusSelect from '@pipeline/components/StatusSelect/StatusSelect'
import NewPipelineSelect from '@pipeline/components/NewPipelineSelect/NewPipelineSelect'
import { getFeaturePropsForRunPipelineButton, getRbacButtonModules } from '@pipeline/utils/runPipelineUtils'
import { useBooleanStatus, useUpdateQueryParams } from '@common/hooks'
import { Page } from '@common/exports'
import type { ExecutionStatus } from '@pipeline/utils/statusHelpers'
import type { GetListOfExecutionsQueryParams } from 'services/pipeline-ng'
import RbacButton from '@rbac/components/Button/Button'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'

import { ExecutionCompareYaml } from '@pipeline/components/ExecutionCompareYaml/ExecutionCompareYaml'
import { useExecutionCompareContext } from '@pipeline/components/ExecutionCompareYaml/ExecutionCompareContext'
import { useExecutionListFilterContext } from '../ExecutionListFilterContext/ExecutionListFilterContext'
import { ExecutionFilters } from '../ExecutionListFilter/ExecutionListFilter'
import type { QuickStatusParam } from '../types'
import css from './ExecutionListSubHeader.module.scss'

export interface FilterQueryParams {
  query?: string
  pipeline?: string
  status?: ExecutionStatus | null
}
export interface ExecutionListSubHeaderProps {
  onRunPipeline(): void
  isPipelineInvalid?: boolean
}

const defaultPageNumber = 1

export function ExecutionListSubHeader(props: ExecutionListSubHeaderProps): React.ReactElement {
  const { module, pipelineIdentifier } = useParams<Partial<PipelineType<PipelinePathProps>>>()
  const { queryParams } = useExecutionListFilterContext()
  const { updateQueryParams } = useUpdateQueryParams<Partial<GetListOfExecutionsQueryParams>>()
  const rbacButtonModules = getRbacButtonModules(module)
  const { getString } = useStrings()
  const { isCompareMode, cancelCompareMode, compareItems } = useExecutionCompareContext()
  const { state: showCompareExecutionDrawer, close, open } = useBooleanStatus(false)

  function handleQueryChange(query: string): void {
    if (query) {
      updateQueryParams({ searchTerm: query, page: defaultPageNumber })
    } else {
      updateQueryParams({ searchTerm: [] as any }) // removes the param
    }
  }

  function handleMyDeployments(isChecked: boolean): void {
    if (isChecked) {
      updateQueryParams({ myDeployments: true })
    } else {
      updateQueryParams({ myDeployments: [] as any }) // removes the param
    }
  }

  function handleStatusChange(status?: QuickStatusParam | null): void {
    if (status) {
      updateQueryParams({ status, page: defaultPageNumber })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateQueryParams({ status: [] as any }) // removes the param
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  function handlePipelineChange(pipelineIdentifier?: string): void {
    if (pipelineIdentifier) {
      updateQueryParams({ pipelineIdentifier, page: defaultPageNumber })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateQueryParams({ pipelineIdentifier: [] as any }) // removes the param
    }
  }

  if (isCompareMode) {
    return (
      <>
        <Page.SubHeader className={css.main}>
          <Text font={{ variation: FontVariation.LEAD }}>{getString('pipeline.execution.compareExecutionsTitle')}</Text>
          <Layout.Horizontal spacing="small" flex={{ alignItems: 'flex-end', justifyContent: 'flex-start' }}>
            <Button
              text={getString('pipeline.execution.compareAction')}
              variation={ButtonVariation.PRIMARY}
              onClick={() => open()}
              disabled={compareItems.length < 2}
            />
            <Button
              text={getString('cancel')}
              variation={ButtonVariation.TERTIARY}
              onClick={() => cancelCompareMode()}
            />
          </Layout.Horizontal>
        </Page.SubHeader>
        {showCompareExecutionDrawer && (
          <ExecutionCompareYaml
            compareItems={compareItems}
            onClose={() => {
              close()
              cancelCompareMode()
            }}
          />
        )}
      </>
    )
  }

  return (
    <Page.SubHeader className={css.main}>
      <div className={css.lhs}>
        <RbacButton
          variation={ButtonVariation.PRIMARY}
          className={css.runButton}
          onClick={props.onRunPipeline}
          disabled={props.isPipelineInvalid}
          tooltip={props.isPipelineInvalid ? getString('pipeline.cannotRunInvalidPipeline') : ''}
          permission={{
            resource: {
              resourceType: ResourceType.PIPELINE,
              resourceIdentifier: pipelineIdentifier || queryParams.pipelineIdentifier
            },
            permission: PermissionIdentifier.EXECUTE_PIPELINE,
            options: {
              skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
            }
          }}
          featuresProps={getFeaturePropsForRunPipelineButton({ modules: rbacButtonModules, getString })}
        >
          <String stringID="runPipelineText" />
        </RbacButton>
        <Checkbox
          font={{ size: 'small', weight: 'semi-bold' }}
          color={Color.GREY_800}
          label={getString(
            (() => {
              switch (module) {
                case 'ci':
                  return 'pipeline.myBuildsText'
                case 'cd':
                  return 'pipeline.myDeploymentsText'
                case 'sto':
                  return 'pipeline.mySecurityTestsText'
                default:
                  return 'pipeline.myPipelineRunsText'
              }
            })()
          )}
          checked={queryParams.myDeployments}
          onChange={e => handleMyDeployments(e.currentTarget.checked)}
          className={cx(css.myDeploymentsCheckbox, { [css.selected]: queryParams.myDeployments })}
        />
        <StatusSelect value={queryParams.status as ExecutionStatus[]} onSelect={handleStatusChange} />
        {pipelineIdentifier ? null : (
          <NewPipelineSelect
            selectedPipeline={queryParams.pipelineIdentifier}
            onPipelineSelect={handlePipelineChange}
          />
        )}
      </div>
      <div className={css.rhs}>
        <ExpandingSearchInput
          defaultValue={queryParams.searchTerm}
          alwaysExpanded
          onChange={handleQueryChange}
          width={200}
          className={css.expandSearch}
        />
        <ExecutionFilters />
      </div>
    </Page.SubHeader>
  )
}
