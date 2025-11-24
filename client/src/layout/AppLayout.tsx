import { Outlet } from 'react-router'
import Navbar from '../components/Navbar'

const AppLayout = () => {
  return (<>
    <h1>hello app</h1>
    <Navbar></Navbar>
    <Outlet></Outlet>
  </>
  )
}

export default AppLayout
