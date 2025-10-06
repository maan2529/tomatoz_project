import { useNavigation } from "react-router-dom"

const GlobalLoader = () => {
  const navigate = useNavigation();
  const isLoading = navigate.state === "loading";

  if (!isLoading) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontSize: "1.5rem",
        zIndex: 9999,
      }}
    >
      Loading...
    </div>
  )
}

export default GlobalLoader