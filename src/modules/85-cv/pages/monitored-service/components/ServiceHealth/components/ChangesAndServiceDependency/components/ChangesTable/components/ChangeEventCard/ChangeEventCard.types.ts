/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { ChangeEventDTO } from 'services/cv'

export interface ChangeInfoData {
  triggerAt: string
  summary: {
    [key: string]: string | { name: string; url?: string }
  }
}

export interface ChangeDetailsDataInterface {
  type?: ChangeEventDTO['type']
  category?: ChangeEventDTO['category']
  status?: ChangeEventDTO['metadata']['status']
  details: {
    [key: string]: string | { name: string | ChangeEventDTO['type']; url?: string }
  }
  executedBy?: React.ReactElement
}

export interface ChangeTitleData {
  name: string | undefined
  type: ChangeEventDTO['type']
  executionId: string
  url?: string
  status?: string
  serviceIdentifier?: string
  envIdentifier?: string
}

export interface CustomChangeEventDTO extends ChangeEventDTO {
  id?: string
  pipelinePath?: string
}
