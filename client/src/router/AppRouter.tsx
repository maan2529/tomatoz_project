import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { Provider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import { store } from "../config/store"
// import GlobalLoader from "../component/GlobalLoader"
import MainLayout from "../layout/MainLayout"
import Home from "../feature/home"
import queryClient from "../config/queryClient"
import GlobalLoader from "../component/GlobalLoader"

const AppRouter = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          index: true,
          element: <Home />,
        },
      ],
    },
  ])

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <GlobalLoader />
        <RouterProvider router={router} />
      </Provider>
    </QueryClientProvider>
  )
}

export default AppRouter