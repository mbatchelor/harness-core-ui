/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { SelectOption } from '@wings-software/uicore'
import type { StringKeys } from 'framework/strings'

export enum VariableType {
  String = 'String',
  Secret = 'Secret',
  Number = 'Number'
}

export const labelStringMap: Record<VariableType, StringKeys> = {
  [VariableType.String]: 'string',
  [VariableType.Secret]: 'secretType',
  [VariableType.Number]: 'number'
}

export const getVariableTypeOptions = (getString: (key: StringKeys) => string): SelectOption[] =>
  [VariableType.String, VariableType.Secret, VariableType.Number].map(type => ({
    label: getString(labelStringMap[type]),
    value: type
  }))
