/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Color } from '@harness/design-system'
import { isEmpty } from 'lodash-es'
import { Icon, Layout, Table, Select, SelectOption, TextInput, Text } from '@wings-software/uicore'
import type { CellProps } from 'react-table'
import type { Service, ServiceDep } from 'services/lw'
import { useStrings } from 'framework/strings'
import css from './COGatewayConfig.module.scss'

interface CORuleDendencySelectorProps {
  deps: ServiceDep[]
  setDeps: (s: ServiceDep[]) => void
  service_id: number | undefined
  allServices: Service[]
}

const CORuleDendencySelector: React.FC<CORuleDendencySelectorProps> = props => {
  const { getString } = useStrings()
  const [allServices, setAllServices] = useState<SelectOption[]>([])
  const [serviceListToShow, setServiceListToShow] = useState<SelectOption[]>([])
  const [error, setError] = useState<{ indices: number[]; val: string }>()

  const setFilteredServicesList = (serviceIdToBeFiltered?: number) => {
    const services: SelectOption[] = !props.allServices
      ? /* istanbul ignore next */ []
      : props.allServices
          .filter(x => x.id !== serviceIdToBeFiltered)
          .map(r => {
            return {
              label: r.name as string,
              value: r.id as number
            }
          }) || /* istanbul ignore next */ []
    setAllServices(services)
    setServiceListToShow(services)
  }

  useEffect(() => {
    if (!props.allServices) {
      setAllServices([])
      return
    }
    setFilteredServicesList(props.service_id)
  }, [props.allServices])

  useEffect(() => {
    if (!isEmpty(serviceListToShow)) {
      const depIds = props.deps.map(d => d.dep_id)
      setServiceListToShow(prevList => prevList.filter(s => !depIds.includes(s.value as number)))
    }
  }, [props.deps])

  /* istanbul ignore next */
  const removeError = (index: number) => {
    if (error?.indices.includes(index)) {
      if (error.indices.length === 1) setError(undefined)
      else
        setError(prevData => ({
          indices: prevData?.indices.filter(_i => _i !== index) as number[],
          val: prevData?.val as string
        }))
    }
  }

  function updateDependency(index: number, column: string, value: number) {
    if (isNaN(value)) {
      const val = getString('ce.co.gatewayConfig.invalidInputError')
      setError(prevData => ({
        indices: [...new Set([...(prevData?.indices || []), index])],
        val
      }))
    } else {
      removeError(index)
    }
    const depsConfig = [...props.deps]
    switch (column) {
      case 'dep_id': {
        depsConfig[index]['dep_id'] = value
        break
      }
      /* istanbul ignore next */
      case 'delay_secs': {
        depsConfig[index]['delay_secs'] = value
        break
      }
    }
    props.setDeps(depsConfig)
  }

  const deleteDependency = (index: number, data: ServiceDep) => {
    removeError(index)
    const depConfig = [...props.deps]
    depConfig.splice(index, 1)
    const deletedService = allServices.find(s => s.value === data.dep_id) as SelectOption
    if (deletedService) {
      setServiceListToShow(prevList => [...prevList, deletedService])
    }
    props.setDeps(depConfig)
  }

  const getItembyValue = (items: SelectOption[], value: string): SelectOption => {
    return items.filter(x => x.value == value)[0]
  }

  function ServiceCell(tableProps: CellProps<ServiceDep>): JSX.Element {
    return (
      <Select
        className={css.selectCell}
        value={getItembyValue(allServices, tableProps.value)}
        items={serviceListToShow}
        onChange={e => {
          updateDependency(tableProps.row.index, tableProps.column.id, e.value as number)
        }}
      />
    )
  }
  function TableCell(tableProps: CellProps<ServiceDep>): JSX.Element {
    return (
      <>
        <TextInput
          defaultValue={tableProps.value}
          className={css.advancedConfigInput}
          style={{ border: 'none' }}
          onBlur={e => {
            const value = (e.currentTarget as HTMLInputElement).value
            updateDependency(tableProps.row.index, tableProps.column.id, +value)
          }}
        />
        {
          /* istanbul ignore next */ error?.val && error.indices.includes(tableProps.row.index) && (
            <Text color={Color.RED_500}>{error.val}</Text>
          )
        }
      </>
    )
  }
  function DeleteCell(tableProps: CellProps<ServiceDep>): JSX.Element {
    return <Icon name="trash" onClick={() => deleteDependency(tableProps.row.index, tableProps.row.original)}></Icon>
  }

  return (
    <Layout.Vertical>
      <Table<ServiceDep>
        data={props.deps}
        className={css.dependencyTable}
        bpTableProps={{}}
        columns={[
          {
            accessor: 'dep_id',
            Header: 'RULES',
            width: '16.5%',
            Cell: ServiceCell
          },
          {
            accessor: 'delay_secs',
            Header: 'DELAY IN SECS',
            width: '16.5%',
            Cell: TableCell,
            disableSortBy: true
          },
          {
            Header: '',
            id: 'menu',
            accessor: row => row.dep_id,
            width: '16.5%',
            Cell: DeleteCell
          }
        ]}
      />
    </Layout.Vertical>
  )
}

export default CORuleDendencySelector
