/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { get, isEmpty } from 'lodash-es'
import moment from 'moment'
import { RUNTIME_INPUT_VALUE, SelectOption } from '@harness/uicore'
import type { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { RegExAllowedInputExpression } from '@pipeline/components/PipelineSteps/Steps/CustomVariables/CustomVariableInputSet'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import type { PipelineInfoConfig } from 'services/pipeline-ng'
import type { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { ConnectorRefWidth } from './constants'

// Returns first 7 letters of commit ID
export function getShortCommitId(commitId: string): string {
  return commitId.slice(0, 7)
}
const cloneCodebaseKeyRef = 'stage.spec.cloneCodebase'

export enum CodebaseTypes {
  branch = 'branch',
  tag = 'tag',
  PR = 'PR'
}

// TODO: Add singular forms, better using i18n because they have support for it
export function getTimeAgo(timeStamp: number): string {
  const currentDate = moment(new Date())
  const timeStampAsDate = moment(timeStamp)

  if (currentDate.diff(timeStampAsDate, 'days') > 30) {
    return `on ${timeStampAsDate.format('MMM D')}`
  } else if (currentDate.diff(timeStampAsDate, 'days') === 1) {
    return 'yesterday'
  } else if (currentDate.diff(timeStampAsDate, 'days') === 0) {
    if (currentDate.diff(timeStampAsDate, 'minutes') >= 60) {
      return `${currentDate.diff(timeStampAsDate, 'hours')} hours ago`
    } else {
      return `${currentDate.diff(timeStampAsDate, 'minutes')} minutes ago`
    }
  } else {
    return `${currentDate.diff(timeStampAsDate, 'days')} days ago`
  }
}

export function useGitScope(): GitFilterScope | undefined {
  const gitDetails = usePipelineContext()?.state?.gitDetails
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  if (!isEmpty(gitDetails)) {
    return {
      repo: gitDetails.repoIdentifier!,
      branch: gitDetails.branch!,
      getDefaultFromOtherRepo: true
    }
  } else if (!!repoIdentifier && !!branch) {
    return {
      repo: repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  }
}

export const getAllowedValuesFromTemplate = (template: Record<string, any>, fieldPath: string): SelectOption[] => {
  if (!template || !fieldPath) {
    return []
  }
  const value = get(template, fieldPath, '')
  const items: SelectOption[] = []
  if (RegExAllowedInputExpression.test(value as string)) {
    // This separates out "<+input>.allowedValues(a, b, c)" to ["<+input>", ["a", "b", "c"]]
    const match = (value as string).match(RegExAllowedInputExpression)
    if (match && match?.length > 1) {
      const allowedValues = match[1]
      items.push(...allowedValues.split(',').map(item => ({ label: item, value: item })))
    }
  }
  return items
}

export const shouldRenderRunTimeInputView = (value: any): boolean => {
  if (!value) {
    return false
  }
  if (typeof value === 'object') {
    return Object.keys(value).some(key => typeof value[key] === 'string' && value[key].startsWith(RUNTIME_INPUT_VALUE))
  } else {
    return typeof value === 'string' && value.startsWith(RUNTIME_INPUT_VALUE)
  }
}

export const shouldRenderRunTimeInputViewWithAllowedValues = (
  fieldPath: string,
  template?: Record<string, any>
): boolean => {
  if (!template || !fieldPath) {
    return false
  }
  const allowedValues = get(template, fieldPath, '')
  return shouldRenderRunTimeInputView(allowedValues) && RegExAllowedInputExpression.test(allowedValues)
}

export const getConnectorRefWidth = (viewType: StepViewType | string): number =>
  Object.entries(ConnectorRefWidth).find(key => key[0] === viewType)?.[1] || ConnectorRefWidth.DefaultView

export const isRuntimeInput = (str: unknown): boolean => typeof str === 'string' && str?.includes(RUNTIME_INPUT_VALUE)

// need to check if this is enabled at least one stage in regular or in paralle
export const isCloneCodebaseEnabledAtLeastOneStage = (pipeline?: PipelineInfoConfig): boolean =>
  !!pipeline?.stages?.some(
    stage =>
      get(stage, cloneCodebaseKeyRef) || stage.parallel?.some(parallelStage => get(parallelStage, cloneCodebaseKeyRef))
  )

export const isCodebaseFieldsRuntimeInputs = (template?: PipelineInfoConfig): boolean =>
  Object.keys(template?.properties?.ci?.codebase || {}).filter(x => x !== 'build')?.length > 0 // show codebase when more fields needed

export const getPipelineWithoutCodebaseInputs = (values: { [key: string]: any }): { [key: string]: any } => {
  if (values?.pipeline) {
    const newPipeline: any = {
      ...values.pipeline
    }
    if (newPipeline?.template?.templateInputs?.properties) {
      delete newPipeline.template.templateInputs.properties
    }
    return newPipeline
  } else {
    const newValues: any = {
      ...values
    }
    if (newValues?.template?.templateInputs?.properties) {
      delete newValues.template.templateInputs.properties
    }
    return newValues
  }
}
