import time from '../scripts/time'

test('Calculate Time', () => {
  expect(time.calculateTime({ start: 0, finish: 0, other: '' })).toBe(0)
  expect(time.calculateTime({ start: 10, finish: 20, other: '' })).toBe(10)
  expect(time.calculateTime({ start: 2124, finish: 5445, other: '' })).toBe(3321)
  expect(time.calculateTime({ start: 20, finish: 5468524, other: '' })).toBe(5468504)
  expect(time.calculateTime({ start: 0, finish: 0, other: 'MS' })).toBe('MS')
  expect(time.calculateTime({ start: 10, finish: 20, other: 'MF' })).toBe('MF')
  expect(time.calculateTime({ start: 2124, finish: 5445, other: 'Test' })).toBe('Test')
  expect(time.calculateTime({ start: 20, finish: 5468524, other: 'MS W1 M2-3 MF' })).toBe('MS W1 M2-3 MF')
})

test('Elapsed Time', () => {
  expect(time.elapsed(0)).toBe('00:00')
  expect(time.elapsed(1)).toBe('00:01')
  expect(time.elapsed(45)).toBe('00:45')
  expect(time.elapsed(60)).toBe('01:00')
  expect(time.elapsed(83)).toBe('01:23')
  expect(time.elapsed(1023)).toBe('17:03')
  expect(time.elapsed(3600)).toBe('60:00')
  expect(time.elapsed(5117)).toBe('85:17')
})

test('Actual Time', () => {
  expect(time.actual(0)).toBe('00:00:00')
  expect(time.actual(1)).toBe('00:00:01')
  expect(time.actual(45)).toBe('00:00:45')
  expect(time.actual(60)).toBe('00:01:00')
  expect(time.actual(83)).toBe('00:01:23')
  expect(time.actual(1023)).toBe('00:17:03')
  expect(time.actual(3600)).toBe('01:00:00')
  expect(time.actual(11520)).toBe('03:12:00')
  expect(time.actual(32130)).toBe('08:55:30')
  expect(time.actual(42443)).toBe('11:47:23')
})
