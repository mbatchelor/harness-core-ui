/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useEffect, useState } from 'react'
import { defaultTo, flatMapDeep, identity, isEmpty, map, sortBy, sortedUniq } from 'lodash-es'
import type { VariableMergeServiceResponse, VariableResponseMapValue } from 'services/pipeline-ng'
import { useTemplateVariables } from '../../TemplateVariablesContext/TemplateVariablesContext'
import { usePipelineVariables } from '../../PipelineVariablesContext/PipelineVariablesContext'
import { usePipelineContext } from '../PipelineContext/PipelineContext'
/**
 * Traverse over stage and find out all local fqn
 */
function traverseStageObject(
  jsonObj: Record<string, any>,
  metadataMap: Required<VariableMergeServiceResponse>['metadataMap']
): string[] {
  const keys: string[] = []
  if (jsonObj !== null && typeof jsonObj == 'object') {
    Object.entries(jsonObj).forEach(([_key, value]) => {
      keys.push(...traverseStageObject(value, metadataMap))
    })
  } else if (metadataMap[jsonObj]) {
    keys.push(jsonObj)
  }
  return keys
}

function pickExpressionsFromMetadataMap(
  metadataMap: Record<string, VariableResponseMapValue>,
  localStageKeys: string[],
  key: 'yamlProperties' | 'yamlOutputProperties'
): string[] {
  return sortedUniq(
    sortBy(
      map(metadataMap, (item, index) =>
        localStageKeys.indexOf(index) > -1 ? defaultTo(item[key]?.localName, '') : defaultTo(item[key]?.fqn, '')
      ).filter(p => p),
      identity
    )
  )
}

function pickExtraExpressionsFromMetadataMap(
  metadataMap: Record<string, VariableResponseMapValue>,
  localStageKeys: string[],
  key: 'properties' | 'outputproperties'
): string[] {
  return sortedUniq(
    sortBy(
      flatMapDeep(metadataMap, (item, index) => {
        const properties = defaultTo(item.yamlExtraProperties?.[key], [])

        return properties.map((p: Record<string, string>) => (localStageKeys.indexOf(index) > -1 ? p.localName : p.fqn))
      }).filter(p => p),
      identity
    )
  )
}

/**
 * Hook to integrate and get expression for local stage and other stage
 */
export function useVariablesExpression(): { expressions: string[] } {
  const { variablesPipeline, metadataMap, serviceExpressionPropertiesList, initLoading } = usePipelineVariables()
  const {
    originalTemplate,
    variablesTemplate,
    metadataMap: templateMetadataMap,
    initLoading: templateInitLoading
  } = useTemplateVariables()
  const [expressions, setExpressions] = useState<string[]>([])
  const [localStageKeys, setLocalStageKeys] = useState<string[]>([])
  const {
    state: { selectionState: { selectedStageId } = { selectedStageId: '' } },
    getStageFromPipeline
  } = usePipelineContext()

  useEffect(() => {
    if (!initLoading && selectedStageId && !isEmpty(selectedStageId)) {
      const stage = getStageFromPipeline(selectedStageId, variablesPipeline).stage
      if (stage) {
        const keys = traverseStageObject(stage, metadataMap)
        setLocalStageKeys(keys)
      }
    }
  }, [variablesPipeline, initLoading, selectedStageId, metadataMap, getStageFromPipeline])

  useEffect(() => {
    if (!templateInitLoading && originalTemplate.type === 'Pipeline' && selectedStageId && !isEmpty(selectedStageId)) {
      const stage = getStageFromPipeline(selectedStageId, variablesTemplate).stage
      if (stage) {
        const keys = traverseStageObject(stage, templateMetadataMap)
        setLocalStageKeys(keys)
      }
    }
  }, [variablesTemplate, templateInitLoading, selectedStageId, templateMetadataMap, getStageFromPipeline])

  useEffect(() => {
    if (!initLoading && !isEmpty(metadataMap)) {
      const expression = pickExpressionsFromMetadataMap(metadataMap, localStageKeys, 'yamlProperties')
      const outputExpression = pickExpressionsFromMetadataMap(metadataMap, localStageKeys, 'yamlOutputProperties')
      const extraExpressions = pickExtraExpressionsFromMetadataMap(metadataMap, localStageKeys, 'properties')
      const extraOutputExpressions = pickExtraExpressionsFromMetadataMap(
        metadataMap,
        localStageKeys,
        'outputproperties'
      )

      const otherExpressions = serviceExpressionPropertiesList.map(row => row.expression).filter(p => p) as string[]
      setExpressions([
        ...otherExpressions,
        ...expression,
        ...extraExpressions,
        ...outputExpression,
        ...extraOutputExpressions
      ])
    }
  }, [initLoading, metadataMap, localStageKeys, serviceExpressionPropertiesList])

  useEffect(() => {
    if (!templateInitLoading && !isEmpty(templateMetadataMap)) {
      const expression = pickExpressionsFromMetadataMap(templateMetadataMap, localStageKeys, 'yamlProperties')
      const outputExpression = pickExpressionsFromMetadataMap(
        templateMetadataMap,
        localStageKeys,
        'yamlOutputProperties'
      )
      setExpressions([...expression, ...outputExpression])
    }
  }, [templateInitLoading, templateMetadataMap, localStageKeys])

  return { expressions }
}
