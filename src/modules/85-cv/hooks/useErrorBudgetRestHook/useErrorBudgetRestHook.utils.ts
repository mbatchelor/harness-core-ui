/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const calculateErrorBudgetByIncrement = (currentErrorBudget: number, increment = NaN): string => {
  if (Number.isNaN(increment)) {
    return '--'
  }

  return Math.floor(currentErrorBudget + increment).toLocaleString()
}

export const calculateRemainingErrorBudgetByIncrement = (
  currentErrorBudget: number,
  remainingErrorBudget: number,
  increment = NaN,
  returnInPercentage = false
): string => {
  if (Number.isNaN(increment)) {
    return '--'
  }

  const updatedErrorBudget = Math.floor(currentErrorBudget + increment)
  const updatedRemainingErrorBudget = Math.floor(remainingErrorBudget + increment)

  if (returnInPercentage) {
    return ((updatedRemainingErrorBudget / updatedErrorBudget) * 100).toFixed(2)
  }

  return updatedRemainingErrorBudget.toLocaleString()
}
