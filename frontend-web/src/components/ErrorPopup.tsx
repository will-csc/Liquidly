import "../styles/ErrorPopup.css"

type Props = {
  message: string
  kind?: "error" | "success"
}

const ErrorPopup = ({ message, kind = "error" }: Props) => {
  if (!message) return null

  const rootClass = kind === "success" ? "success-popup" : "error-popup"
  const contentClass = kind === "success" ? "success-popup-content" : "error-popup-content"

  return (
    <div className={rootClass}>
      <div className={contentClass}>{message}</div>
    </div>
  )
}

export default ErrorPopup
