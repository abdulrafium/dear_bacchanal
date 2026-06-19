import Homepage from '@/components/pages/home/Homepage'
import { Suspense } from 'react'

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Homepage/>
    </Suspense>
  )
}

export default page
