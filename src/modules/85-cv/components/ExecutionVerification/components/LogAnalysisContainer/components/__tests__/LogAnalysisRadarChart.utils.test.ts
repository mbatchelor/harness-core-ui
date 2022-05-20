import {
  getRadarChartSeries,
  getLogAnalysisSpiderChartOptions,
  getLogAnalysisSpiderChartOptionsWithoutBaseline
} from '../LogAnalysisRadarChart.utils'

describe('LogAnalysisRadarChart.utils', () => {
  test('should return null if no data is provided', () => {
    expect(getRadarChartSeries()).toBeNull()
  })

  test('should return correct tooltip name and should call correct function on click', () => {
    const mockClickFn = jest.fn()
    const res = getLogAnalysisSpiderChartOptions(null, { min: 0, max: 12 }, mockClickFn)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const formatterTooltip = res.tooltip?.formatter?.bind({ series: { name: 'abc' } })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(formatterTooltip?.()).toBe('abc')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.plotOptions?.series?.point?.events?.click({ point: { series: { userOptions: { clusterId: '12' } } } })

    expect(mockClickFn).toHaveBeenCalledWith('12')
  })

  test('should return correct tooltip name and should call correct function on click for without baseline function', () => {
    const mockClickFn = jest.fn()
    const res = getLogAnalysisSpiderChartOptionsWithoutBaseline(null, { min: 0, max: 12 }, mockClickFn)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const formatterTooltip = res.tooltip?.formatter?.bind({ series: { name: 'abc' } })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(formatterTooltip?.()).toBe('abc')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.plotOptions?.series?.point?.events?.click({ point: { series: { userOptions: { clusterId: '12' } } } })

    expect(mockClickFn).toHaveBeenCalledWith('12')
  })
})
