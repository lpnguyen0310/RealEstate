import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Footer from './layouts/Footer.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <p className='font-black'>
        Hello world ok
      </p>
      <Footer />
    </>
  )
}

export default App
