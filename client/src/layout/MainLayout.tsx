import { Outlet } from 'react-router-dom'
import Navbar from '../component/Navbar'

const MainLayout = () => {
  return <>
    <h1>Hello main</h1>
    <Navbar></Navbar>
    <Outlet></Outlet>
  </>
}

export default MainLayout