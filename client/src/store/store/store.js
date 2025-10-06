import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../store/store/'
export default configureStore({
    reducer: {
        counter: counterReducer
    },
})