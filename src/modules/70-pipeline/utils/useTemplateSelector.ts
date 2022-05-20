/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { parse } from 'yaml'
import { useParams } from 'react-router-dom'
import { merge, set } from 'lodash-es'
import { SelectorData, TemplateDrawerTypes } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { findAllByKey, usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { getTemplateTypesByRef } from '@pipeline/utils/templateUtils'
import type { TemplateSummaryResponse } from 'services/template-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

export interface GetTemplateResponse {
  template: TemplateSummaryResponse
  isCopied: boolean
}

export type GetTemplateProps = Omit<SelectorData, 'onSubmit' | 'onCancel'>

interface TemplateActionsReturnType {
  getTemplate: (data: GetTemplateProps) => Promise<GetTemplateResponse>
}

export function useTemplateSelector(): TemplateActionsReturnType {
  const {
    state: { templateTypes, gitDetails },
    updateTemplateView,
    setTemplateTypes
  } = usePipelineContext()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()

  const closeTemplateSelector = React.useCallback(() => {
    updateTemplateView({
      isTemplateDrawerOpened: false,
      templateDrawerData: { type: TemplateDrawerTypes.UseTemplate }
    })
  }, [updateTemplateView])

  const updateTemplateTypes = React.useCallback(
    (template: TemplateSummaryResponse, isCopied: boolean) => {
      if (isCopied) {
        const templateRefs = findAllByKey('templateRef', parse(template?.yaml || '')?.template.spec)
        getTemplateTypesByRef(
          {
            accountIdentifier: accountId,
            orgIdentifier: orgIdentifier,
            projectIdentifier: projectIdentifier,
            templateListType: 'Stable',
            repoIdentifier: gitDetails.repoIdentifier,
            branch: gitDetails.branch,
            getDefaultFromOtherRepo: true
          },
          templateRefs
        ).then(resp => {
          setTemplateTypes(merge(templateTypes, resp))
        })
      } else if (template?.identifier && template?.childType) {
        set(templateTypes, template.identifier, template.childType)
        setTemplateTypes(templateTypes)
      }
    },
    [accountId, orgIdentifier, projectIdentifier, gitDetails, templateTypes, setTemplateTypes]
  )

  const getTemplate = React.useCallback(
    (selectorData: GetTemplateProps): Promise<GetTemplateResponse> => {
      return new Promise((resolve, reject) => {
        updateTemplateView({
          isTemplateDrawerOpened: true,
          templateDrawerData: {
            type: TemplateDrawerTypes.UseTemplate,
            data: {
              selectorData: {
                ...selectorData,
                onSubmit: (template: TemplateSummaryResponse, isCopied: boolean) => {
                  closeTemplateSelector()
                  updateTemplateTypes(template, isCopied)
                  resolve({ template, isCopied })
                },
                onCancel: () => {
                  closeTemplateSelector()
                  reject()
                }
              }
            }
          }
        })
      })
    },
    [updateTemplateView, closeTemplateSelector, updateTemplateTypes]
  )

  return { getTemplate }
}
