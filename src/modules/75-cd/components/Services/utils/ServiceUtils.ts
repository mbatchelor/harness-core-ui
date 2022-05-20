/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { set } from 'lodash-es'
import type { PipelineInfoConfig } from 'services/cd-ng'

export enum ServiceTabs {
  SUMMARY = 'summaryTab',
  Configuration = 'configuration',
  REFERENCED_BY = 'refrencedByTab',
  ActivityLog = 'activityLog'
}

export const DefaultNewStageName = 'Stage Name'
export const DefaultNewStageId = 'stage_id'
export const DefaultNewServiceId = '-1'

const DefaultService = {
  serviceDefinition: {
    spec: {
      variables: []
    }
  }
}

export const initialServiceState = {
  service: { ...DefaultService }
  // isLoading: false,
  // isBETemplateUpdated: false,
  // isDBInitialized: false,
  // isUpdated: false,
  // isInitialized: false,
  // gitDetails: {},
  // entityValidityDetails: {}
}

export const setNameIDDescription = (draftData: PipelineInfoConfig, updatedData: PipelineInfoConfig): void => {
  set(draftData, 'identifier', updatedData.identifier)
  set(draftData, 'name', updatedData.name)
  set(draftData, 'description', updatedData.description)
  set(draftData, 'tags', updatedData.tags)
}
