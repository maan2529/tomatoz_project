import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { Provider } from "react-redux"
import { QueryClientProvider } from "@tanstack/react-query"
import { store } from "../config/store"
// import GlobalLoader from "../component/GlobalLoader"
import MainLayout from "../layout/MainLayout"
import Home from "../feature/home"
import AppShowcase from "../feature/app"
import queryClient from "../config/queryClient"
import NotFound from "../components/NotFound"
// import GlobalLoader from "../component/GlobalLoader"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
        {
          path: "app",
          element: <AppShowcase />,
          loader: async () => {
            await sleep(800)
            return null
          },
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    }
  ])

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </QueryClientProvider>
  )
}

export default AppRouter