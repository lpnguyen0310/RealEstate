import { useState } from 'react'
import './App.css'
import Header from './layouts/Header'
import Footer from './layouts/Footer.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <p className='font-black'>
        Hello world
      </p>
      <Footer />
    </>
  )
}

export default App
