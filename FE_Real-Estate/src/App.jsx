import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <p className='font-black text-3xl text-blue-500'>
        Hello world
      </p>
    </>
  )
}

export default App
