/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import type { MultiSelectOption, SelectOption } from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import { isEmpty } from 'lodash-es'
import type { ServiceNowFieldAllowedValueNG, ServiceNowFieldNG, ServiceNowFieldValueNG } from 'services/cd-ng'
import type { ServiceNowCreateData, ServiceNowCreateFieldType, ServiceNowFieldNGWithValue } from './types'
import type { ServiceNowUpdateData } from '../ServiceNowUpdate/types'
import { FieldType, ServiceNowStaticFields } from './types'

export const resetForm = (
  formik: FormikProps<ServiceNowCreateData> | FormikProps<ServiceNowUpdateData>,
  parent: string
) => {
  if (parent === 'connectorRef') {
    formik.setFieldValue('spec.ticketType', '')
    formik.setFieldValue('spec.fields', [])
  }

  if (parent === 'ticketType') {
    formik.setFieldValue('spec.fields', [])
  }
  if (parent === 'templateName') {
    formik.setFieldValue('spec.templateFields', [])
  }
}

export const omitDescNShortDesc = (fields: ServiceNowCreateFieldType[]): ServiceNowCreateFieldType[] =>
  fields?.filter(
    field =>
      field.name !== ServiceNowStaticFields.description && field.name !== ServiceNowStaticFields.short_description
  )

export const processFieldsForSubmit = (values: ServiceNowCreateData): ServiceNowCreateFieldType[] => {
  const toReturn: ServiceNowCreateFieldType[] =
    values.spec.fieldType === FieldType.ConfigureFields
      ? [
          {
            name: ServiceNowStaticFields.description,
            value: values.spec.description || ''
          },
          {
            name: ServiceNowStaticFields.short_description,
            value: values.spec.shortDescription || ''
          }
        ]
      : []
  values.spec.selectedFields?.forEach((field: ServiceNowFieldNGWithValue) => {
    const name = field.key
    const value =
      typeof field.value === 'string' || typeof field.value === 'number'
        ? field.value
        : Array.isArray(field.value)
        ? (field.value as MultiSelectOption[]).map(opt => opt.value.toString()).join(',')
        : typeof field.value === 'object'
        ? (field.value as SelectOption).value?.toString()
        : ''
    // The return value should be comma separated string or a number
    toReturn.push({ name, value })
  })
  values.spec.fields?.forEach((kvField: ServiceNowCreateFieldType) => {
    const alreadyExists = toReturn.find(ff => ff.name === kvField.name)
    if (!alreadyExists) {
      toReturn.push(kvField)
    }
  })
  return toReturn
}

export const getInitialValueForSelectedField = (
  savedFields: ServiceNowCreateFieldType[],
  serviceNowFieldNG: ServiceNowFieldNG
): string | number | SelectOption | MultiSelectOption[] => {
  const savedValue = savedFields.find(sf => sf.name === serviceNowFieldNG.key)?.value
  if (typeof savedValue === 'number') {
    return savedValue as number
  } else if (typeof savedValue === 'string') {
    if (serviceNowFieldNG.allowedValues && serviceNowFieldNG.schema?.type === 'option') {
      const labelOfSelectedDropDown: ServiceNowFieldAllowedValueNG | undefined = serviceNowFieldNG.allowedValues.find(
        field => field.id === savedValue
      )
      return { label: labelOfSelectedDropDown?.name || savedValue, value: savedValue } as SelectOption
    }
    return savedValue as string
  }
  return ''
}

export const processFormData = (values: ServiceNowCreateData): ServiceNowCreateData => {
  let serviceNowSpec
  if (!values.spec.useServiceNowTemplate) {
    serviceNowSpec = {
      spec: {
        delegateSelectors: values.spec.delegateSelectors,
        useServiceNowTemplate: false,
        connectorRef: values.spec.connectorRef,
        ticketType: values.spec.ticketType,
        fields: processFieldsForSubmit(values)
      }
    }
  } else {
    serviceNowSpec = {
      spec: {
        delegateSelectors: values.spec.delegateSelectors,
        useServiceNowTemplate: true,
        connectorRef: values.spec.connectorRef,
        ticketType: values.spec.ticketType,
        fields: [],
        templateName: values.spec.templateName
      }
    }
  }
  return {
    ...values,
    ...serviceNowSpec
  }
}

export const getKVFields = (values: ServiceNowCreateData): ServiceNowCreateFieldType[] => {
  return processFieldsForSubmit(values)
}

export const processInitialValues = (values: ServiceNowCreateData): ServiceNowCreateData => {
  return {
    ...values,
    spec: {
      delegateSelectors: values.spec.delegateSelectors,
      connectorRef: values.spec.connectorRef,
      useServiceNowTemplate: values.spec.useServiceNowTemplate,
      fieldType: values.spec.useServiceNowTemplate ? FieldType.CreateFromTemplate : FieldType.ConfigureFields,
      ticketType: values.spec.ticketType,
      description: values.spec.fields
        ?.find(field => field.name === ServiceNowStaticFields.description)
        ?.value.toString() as string,
      shortDescription: values.spec.fields
        ?.find(field => field.name === ServiceNowStaticFields.short_description)
        ?.value.toString() as string,
      fields: omitDescNShortDesc(values.spec.fields),
      templateName: values.spec.templateName,
      selectedFields: [],
      templateFields: []
    }
  }
}

export const getSelectedFieldsToBeAddedInForm = (
  newFields: ServiceNowFieldNG[],
  existingFields: ServiceNowFieldNGWithValue[] = [],
  existingKVFields: ServiceNowCreateFieldType[]
): ServiceNowFieldNGWithValue[] => {
  const toReturn: ServiceNowFieldNGWithValue[] = []
  newFields.forEach(field => {
    const alreadyPresent = existingFields.find(existing => existing.key === field.key)
    const alreadyPresentKVField = existingKVFields.find(kv => kv.name === field.name)
    if (!alreadyPresent && !alreadyPresentKVField) {
      toReturn.push({ ...field, value: !isEmpty(field.allowedValues) ? [] : '' })
    } else {
      toReturn.push({ ...field, value: alreadyPresent !== undefined ? alreadyPresent?.value : '' })
    }
  })
  return toReturn
}

export const getKVFieldsToBeAddedInForm = (
  newFields: ServiceNowCreateFieldType[],
  existingFields: ServiceNowCreateFieldType[] = [],
  existingSelectedFields: ServiceNowFieldNG[] = []
): ServiceNowCreateFieldType[] => {
  const toReturn: ServiceNowCreateFieldType[] = [...existingFields]
  newFields.forEach(field => {
    const alreadyPresent = existingFields.find(existing => existing.name === field.name)
    const alreadyPresentSelectedField = existingSelectedFields.find(existing => existing.key === field.name)
    if (!alreadyPresent && !alreadyPresentSelectedField) {
      toReturn.push(field)
    }
  })
  return toReturn
}

export const updateMap = (alreadySelectedFields: ServiceNowFieldNG[]): Record<string, boolean> => {
  const map: Record<string, boolean> = {}
  if (!isEmpty(alreadySelectedFields)) {
    alreadySelectedFields.forEach(field => {
      map[field.name] = true
    })
  }
  return map
}

export const setServiceNowFieldAllowedValuesOptions = (
  allowedValues: ServiceNowFieldAllowedValueNG[]
): MultiSelectOption[] =>
  allowedValues.map(allowedValue => ({
    label: allowedValue.value || allowedValue.name || allowedValue.id || '',
    value: allowedValue.id || ''
  }))

export const removeServiceNowMandatoryFields = (fieldList: ServiceNowFieldNG[]): ServiceNowFieldNG[] => {
  fieldList = fieldList.filter(
    item => item.key !== ServiceNowStaticFields.short_description && item.key !== ServiceNowStaticFields.description
  )
  return fieldList
}

export const convertTemplateFieldsForDisplay = (fields: {
  [key: string]: ServiceNowFieldValueNG
}): ServiceNowFieldValueNG[] => {
  const fieldsAsServiceNowField: ServiceNowFieldValueNG[] = []
  for (const item of Object.entries(fields)) {
    fieldsAsServiceNowField.push({
      displayValue: item[0],
      value: item[1].displayValue?.toString()
    } as ServiceNowFieldValueNG)
  }
  return fieldsAsServiceNowField
}
