/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, PageSpinner, Pagination, TableV2 } from '@harness/uicore'
import type { ResponsePageServiceResponse, ServiceResponseDTO } from 'services/cd-ng'
import { ServiceName, ServiceDescription, ServiceMenu } from '../ServicesListColumns/ServicesListColumns'

import css from './ServicesListView.module.scss'
interface ServicesListViewProps {
  data: ResponsePageServiceResponse | null
  loading?: boolean
  onRefresh?: () => Promise<void>
  gotoPage?: (index: number) => void
  onServiceSelect: (data: any) => Promise<void>
}
const ServicesListView = (props: ServicesListViewProps): React.ReactElement => {
  const { data, gotoPage, onServiceSelect, loading } = props

  const services = data?.data?.content?.map(service => service.service) || []
  if (loading) {
    return <PageSpinner />
  }
  return (
    <>
      <Container className={css.masonry} style={{ height: 'calc(100% - 66px)', width: '100%' }}>
        <TableV2<any>
          className={css.table}
          sortable
          columns={[
            {
              Header: 'SERVICE',
              id: 'name',
              accessor: 'name',
              width: '60%',
              Cell: ServiceName
            },
            {
              Header: 'DESCRIPTION',
              id: 'destination',
              accessor: 'description',
              width: '35%',
              Cell: ServiceDescription
            },
            {
              Header: '',
              id: 'menu',
              width: '3%',
              // eslint-disable-next-line react/display-name
              Cell: ({ row }: { row: { original: unknown } }) => (
                <ServiceMenu data={row.original} onRefresh={props.onRefresh} />
              )
            }
          ]}
          data={services}
          onRowClick={(row: ServiceResponseDTO) => onServiceSelect(row)}
        />
      </Container>

      <Container className={css.pagination}>
        <Pagination
          itemCount={data?.data?.totalItems || 0}
          pageSize={data?.data?.pageSize || 10}
          pageCount={data?.data?.totalPages || 0}
          pageIndex={data?.data?.pageIndex || 0}
          gotoPage={gotoPage}
        />
      </Container>
    </>
  )
}

export default ServicesListView
