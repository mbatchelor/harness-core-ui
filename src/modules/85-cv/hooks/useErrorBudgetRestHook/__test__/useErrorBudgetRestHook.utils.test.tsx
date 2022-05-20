/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  calculateErrorBudgetByIncrement,
  calculateRemainingErrorBudgetByIncrement
} from '../useErrorBudgetRestHook.utils'

describe('useErrorBudgetRestHook utils', () => {
  test('calculateErrorBudgetByIncrement', () => {
    expect(calculateErrorBudgetByIncrement(100)).toStrictEqual('--')
    expect(calculateErrorBudgetByIncrement(100, undefined)).toStrictEqual('--')
    expect(calculateErrorBudgetByIncrement(100, NaN)).toStrictEqual('--')
    expect(calculateErrorBudgetByIncrement(100, 100)).toStrictEqual('200')
    expect(calculateErrorBudgetByIncrement(-100, 100)).toStrictEqual('0')
    expect(calculateErrorBudgetByIncrement(100, -100)).toStrictEqual('0')
    expect(calculateErrorBudgetByIncrement(-100, -100)).toStrictEqual('-200')
    expect(calculateErrorBudgetByIncrement(100000, 100)).toStrictEqual('100,100')
  })

  test('calculateRemainingErrorBudgetByIncrement', () => {
    expect(calculateRemainingErrorBudgetByIncrement(100, 50, 100)).toStrictEqual('150')
    expect(calculateRemainingErrorBudgetByIncrement(100000, 50000, 100)).toStrictEqual('50,100')
    expect(calculateRemainingErrorBudgetByIncrement(100, 50, 100, true)).toStrictEqual('75.00')
  })
})
