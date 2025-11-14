import React from 'react'
import Dashboard from './pages/dashboard/Dashboard'
import Consumer from './pages/dashboard/Consumer'
import Builder from './pages/dashboard/Builder'
// import DataComponent from './components/DataComponent'
import User from './pages/dashboard/User'
import { Route, Routes } from 'react-router-dom'

const AuthRoutes = () => {
    return (
        <Routes>
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path="/consumer" element={<Consumer />} />
            <Route path="/builder" element={<Builder />} />
            {/* // <Route path="/data" element={<DataComponent />} /> */}
            <Route path="/user" element={<User />} />
        </Routes>
    )
}

export default AuthRoutes