import { useState } from 'react'
import './App.css'
import Header from './layouts/Header'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Header />
      <p className='font-black text-3xl text-blue-500'>
        Hello world
      </p>
    </>
  )
}

export default App
