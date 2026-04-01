jest.mock("@expo/vector-icons", () => {
  const React = require("react")
  const MockIcon = () => null
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    }
  )
})

jest.mock("expo-camera", () => {
  const React = require("react")
  return {
    CameraView: () => React.createElement("View", null),
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  }
})

const originalError = console.error
console.error = (...args) => {
  const first = args[0]
  if (typeof first === "string" && first.includes("not wrapped in act")) return
  return originalError(...args)
}
