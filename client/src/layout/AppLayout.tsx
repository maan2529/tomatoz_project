import { Outlet } from 'react-router'
import Navbar from '../component/Navbar'

const AppLayout = () => {
  return (<>
    <h1>hello app</h1>
    <Navbar></Navbar>
    <Outlet></Outlet>
  </>
  )
}

export default AppLayout
