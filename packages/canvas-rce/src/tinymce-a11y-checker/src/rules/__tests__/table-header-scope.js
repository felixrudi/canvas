import rule from "../table-header-scope"

let el

beforeEach(() => {
  el = document.createElement("th")
})

describe("test", () => {})

describe("data", () => {})

describe("form", () => {})

describe("update", () => {
  test("returns same element", () => {
    expect(rule.update(el, {})).toBe(el)
  })
})