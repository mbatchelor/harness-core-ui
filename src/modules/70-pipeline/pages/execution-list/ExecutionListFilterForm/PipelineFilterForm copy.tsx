/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { FormikProps } from 'formik'
import { FormInput, SelectOption, Text } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { FilterProperties } from 'services/pipeline-ng'
import {
  getOptionsForMultiSelect,
  BUILD_TYPE,
  DeploymentTypeContext,
  BuildTypeContext
} from '@pipeline/utils/PipelineExecutionFilterRequestUtils'

import type { ModulePathParams } from '@common/interfaces/RouteInterfaces'
import InputDatePicker from '@common/components/InputDatePicker/InputDatePicker'
import css from './ExecutionListFilterForm.module.scss'

export type FormView = 'PIPELINE-META'
interface PipelineFilterFormProps<T> {
  formikProps?: FormikProps<T>
  type: FilterProperties['filterType']
  isCDEnabled: boolean
  isCIEnabled: boolean
  initialValues: FormikProps<T>['initialValues']
}

const NO_SELECTION = { label: '', value: '' }

export default function PipelineFilterForm<
  T extends {
    buildType?: BuildTypeContext['buildType']
    deploymentType?: DeploymentTypeContext['deploymentType']
    infrastructureType?: DeploymentTypeContext['infrastructureType']
  }
>(props: PipelineFilterFormProps<T>): React.ReactElement {
  const { getString } = useStrings()
  const { module } = useParams<ModulePathParams>()
  const { type, formikProps, isCDEnabled, isCIEnabled, initialValues } = props
  const getBuildTypeOptions = (): React.ReactElement => {
    let buildTypeField: JSX.Element = <></>
    const buildType = formikProps?.values?.buildType as BuildTypeContext['buildType']
    const buildTypeOptions = [
      { label: getString('filters.executions.pullOrMergeRequest'), value: BUILD_TYPE.PULL_OR_MERGE_REQUEST },
      { label: getString('pipelineSteps.deploy.inputSet.branch'), value: BUILD_TYPE.BRANCH },
      { label: getString('tagLabel'), value: BUILD_TYPE.TAG }
    ]
    switch (buildType) {
      case BUILD_TYPE.PULL_OR_MERGE_REQUEST:
        buildTypeField = (
          <div className={css.subfilter} key="buildSubType">
            <FormInput.Text
              name={'sourceBranch'}
              label={getString('common.sourceBranch')}
              key={'sourceBranch'}
              placeholder={getString('common.sourceBranchPlaceholder')}
            />
            <FormInput.Text
              name={'targetBranch'}
              label={getString('common.targetBranch')}
              key={'targetBranch'}
              placeholder={getString('common.targetBranchPlaceholder')}
            />
          </div>
        )
        break
      case BUILD_TYPE.BRANCH:
        buildTypeField = (
          <div className={css.subfilter} key="buildSubType">
            <FormInput.Text
              name={'branch'}
              label={getString('pipelineSteps.deploy.inputSet.branch')}
              key={'branch'}
              placeholder={getString('pipeline.manifestType.branchPlaceholder')}
            />
          </div>
        )
        break
      case BUILD_TYPE.TAG:
        buildTypeField = (
          <div className={css.subfilter} key="buildSubType">
            <FormInput.Text
              name={'tag'}
              label={getString('tagLabel')}
              key={'tag'}
              placeholder={getString('filters.executions.tagPlaceholder')}
            />
          </div>
        )
        break
      default:
        break
    }
    return (
      <>
        <>
          <span className={css.separator} key="buildsSeparator">
            <Text>{getString('buildsText').toUpperCase()}</Text>
          </span>
          {(type === 'PipelineExecution' && module === 'ci') || type === 'PipelineSetup' ? (
            <FormInput.Text
              name={'repositoryName'}
              label={getString('common.repositoryName')}
              key={'repositoryName'}
              placeholder={getString('pipeline.manifestType.repoNamePlaceholder')}
            />
          ) : null}
          <FormInput.Select
            selectProps={{
              addClearBtn: true
            }}
            items={buildTypeOptions}
            name="buildType"
            label={getString('filters.executions.buildType')}
            placeholder={getString('pipeline.filters.builtTypePlaceholder')}
            key="buildType"
            value={
              buildType ? buildTypeOptions.find((option: SelectOption) => option.value === buildType) : NO_SELECTION
            }
          />
        </>
        {buildTypeField}
      </>
    )
  }

  const getDeploymentTypeOptions = (): React.ReactElement => {
    const { environments, services, deploymentType } = initialValues as DeploymentTypeContext
    // const infrastructureTypeLabel = { label: getString('kubernetesDirectText'), value: 'Kubernetes Direct' }
    return (
      <>
        <span className={css.separator} key="deploymentSeparator">
          <Text>{getString('deploymentsText').toUpperCase()}</Text>
        </span>

        <FormInput.Select
          items={deploymentType || []}
          name="deploymentType"
          label={getString('deploymentTypeText')}
          placeholder={getString('pipeline.filters.deploymentTypePlaceholder')}
          key="deploymentType"
        />
        {/* <FormInput.Select
          items={[infrastructureTypeLabel]}
          name="infrastructureType"
          label={getString('infrastructureTypeText')}
          key="infrastructureType"
          value={
            (formikProps?.values?.infrastructureType as DeploymentTypeContext['infrastructureType'])
              ? infrastructureTypeLabel
              : NO_SELECTION
          }
        /> */}
        <FormInput.MultiSelect
          items={services || []}
          name="services"
          label={getString('services')}
          key="services"
          placeholder={getString('pipeline.filters.servicePlaceholder')}
          multiSelectProps={{
            allowCreatingNewItems: false
          }}
        />
        <FormInput.MultiSelect
          items={environments || []}
          name="environments"
          label={getString('environments')}
          placeholder={getString('pipeline.filters.environmentPlaceholder')}
          key="environments"
          multiSelectProps={{
            allowCreatingNewItems: false
          }}
        />
      </>
    )
  }

  const getPipelineFormCommonFields = (): React.ReactElement => {
    const isPipeSetupType = type === 'PipelineSetup'

    return (
      <>
        <FormInput.Text
          name={isPipeSetupType ? 'name' : 'pipelineName'}
          label={isPipeSetupType ? getString('name') : getString('filters.executions.pipelineName')}
          key={isPipeSetupType ? 'name' : 'pipelineName'}
          placeholder={getString('pipeline.filters.pipelineNamePlaceholder')}
        />
        {isPipeSetupType ? (
          <>
            <FormInput.Text
              name={'description'}
              label={getString('description')}
              placeholder={getString('common.descriptionPlaceholder')}
              key={'description'}
            />
            <FormInput.KVTagInput name="pipelineTags" label={getString('tagsLabel')} key="pipelineTags" />
          </>
        ) : null}
        {type === 'PipelineExecution' ? (
          <FormInput.MultiSelect
            items={getOptionsForMultiSelect()}
            name="status"
            label={getString('status')}
            placeholder={getString('pipeline.jiraUpdateStep.selectStatus')}
            key="status"
            multiSelectProps={{
              allowCreatingNewItems: false
            }}
          />
        ) : null}
        {type === 'PipelineExecution' ? <InputDatePicker formikProps={formikProps} /> : null}
      </>
    )
  }

  if (isCDEnabled && isCIEnabled) {
    return (
      <>
        <>{getPipelineFormCommonFields()}</>
        <>{getDeploymentTypeOptions()}</>
        <>{getBuildTypeOptions()}</>
      </>
    )
  } else if (isCDEnabled) {
    return (
      <>
        <>{getPipelineFormCommonFields()}</>
        <>{getDeploymentTypeOptions()}</>
      </>
    )
  } else if (isCIEnabled) {
    return (
      <>
        <>{getPipelineFormCommonFields()}</>
        <>{getBuildTypeOptions()}</>
      </>
    )
  }
  return <></>
}
