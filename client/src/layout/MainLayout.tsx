import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
import GlobalLoader from "../components/GlobalLoader"

const MainLayout = () => {
  return (
    <>
      <GlobalLoader />
      <Navbar></Navbar>
      <Outlet></Outlet>
    </>
  )
}

export default MainLayout