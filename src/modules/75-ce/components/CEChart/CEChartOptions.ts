/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type Highcharts from 'highcharts'
import formatCost from '@ce/utils/formatCost'

export const CE_COLOR_CONST = [
  '#25A6F7', // blue
  '#8A77DE', // pruple
  '#FF479F', // pink
  '#FFBC08', // yellow
  '#0BC8D6', // teal
  '#F25C61', // red
  '#7FB800', // green 2
  '#ED61B5', // pink 2
  '#35D6CB', // teal 2
  '#36D068' // green
]

export const CE_CHARTS_ENTITY_LIMIT = 30

export default {
  chart: {
    height: 300,
    animation: {
      duration: 100
    },
    style: {
      fontFamily: 'var(--font-family)'
    }
  },
  boost: {
    seriesThreshold: CE_CHARTS_ENTITY_LIMIT + 2 // https://stackoverflow.com/a/46365043/3860249
  },
  title: {
    text: ''
  },
  yAxis: {
    title: {
      text: ''
    }
  },
  plotOptions: {
    area: {
      lineWidth: 1,
      marker: {
        enabled: false
      }
    },
    column: {
      borderColor: null
    }
  },
  xAxis: {
    type: 'datetime',
    gridLineColor: 'var(--color-chart-line-color)'
  },
  credits: {
    enabled: false
  },
  colors: CE_COLOR_CONST
}

export function getRadialChartOptions(
  series: Array<Record<string, string | number>> = [],
  colors: string[],
  options: Record<string, any> = {},
  strokeSize = '80%'
): Highcharts.Options {
  const data: Array<Record<string, string | number>> = series.map(row => ({
    name: row.name,
    id: row.name,
    y: row.value || row.cost
  }))

  return {
    chart: options.chart || { height: 260, width: 300 },
    tooltip: {
      useHTML: true,
      enabled: options.tooltipDisabled !== false,
      headerFormat: '',
      pointFormatter: function (this: Record<string, string | any>) {
        return `<b>${this.name}</b>: ${formatCost(this.y)}`
      }
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        ...options?.plotOptions?.pie
      }
    },
    series: [
      {
        name: 'Cost',
        innerSize: strokeSize,
        type: 'pie',
        data
      }
    ],
    colors
  }
}
