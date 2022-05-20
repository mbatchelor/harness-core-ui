/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  shouldRenderRunTimeInputView,
  shouldRenderRunTimeInputViewWithAllowedValues,
  getAllowedValuesFromTemplate
} from '../CIUtils'

describe('Test CIUtils', () => {
  test('Test shouldRenderRunTimeInputView method', () => {
    expect(shouldRenderRunTimeInputView('sample-value')).not.toBeTruthy()
    expect(shouldRenderRunTimeInputView('<+input>')).toBeTruthy()
    expect(shouldRenderRunTimeInputView('<+input>.allowedValues(ecr,docker)')).toBeTruthy()
    expect(shouldRenderRunTimeInputView('<+input>.regex(abc*)')).toBeTruthy()
    expect(shouldRenderRunTimeInputView({ key1: '<+input>' })).toBeTruthy()
    expect(shouldRenderRunTimeInputView({ key1: 'sample-value' })).not.toBeTruthy()
    expect(shouldRenderRunTimeInputView({ key1: 'sample-value', key2: '<+input>' })).toBeTruthy()
    expect(
      shouldRenderRunTimeInputView({ key1: 'sample-value', key2: '<+input>.allowedValues(ecr,docker)' })
    ).toBeTruthy()
    expect(shouldRenderRunTimeInputView(123)).not.toBeTruthy()
    expect(shouldRenderRunTimeInputView(null)).not.toBeTruthy()
    expect(shouldRenderRunTimeInputView(undefined)).not.toBeTruthy()
  })

  test('Test shouldRenderRunTimeInputViewWithAllowedValues method', () => {
    expect(
      shouldRenderRunTimeInputViewWithAllowedValues('a.b.c', {
        a: { b: { c: '<+input>.allowedValues(val1,val2,val3)' } }
      })
    ).toBeTruthy()
    expect(shouldRenderRunTimeInputViewWithAllowedValues('')).not.toBeTruthy()
    expect(shouldRenderRunTimeInputViewWithAllowedValues('a.b.c')).not.toBeTruthy()
    expect(
      shouldRenderRunTimeInputViewWithAllowedValues('a.b.c', {
        a: { b: { c: '<+input>' } }
      })
    ).not.toBeTruthy()
    expect(
      shouldRenderRunTimeInputViewWithAllowedValues('a.b.c', {
        a: { b: { c: 'some-value' } }
      })
    ).not.toBeTruthy()
  })

  test('Test getAllowedValuesFromTemplate method', () => {
    expect(
      getAllowedValuesFromTemplate(
        {
          a: { b: { c: '<+input>.allowedValues(val1,val2,val3)' } }
        },
        'a.b.c'
      ).length
    ).toBe(3)
    expect(
      getAllowedValuesFromTemplate(
        {
          a: { b: { c: '<+input>' } }
        },
        'a.b.c'
      ).length
    ).toBe(0)
    expect(
      JSON.stringify(
        getAllowedValuesFromTemplate(
          {
            a: { b: { c: '<+input>.allowedValues(val1)' } }
          },
          'a.b.c'
        )
      )
    ).toBe(JSON.stringify([{ label: 'val1', value: 'val1' }]))
  })
})
