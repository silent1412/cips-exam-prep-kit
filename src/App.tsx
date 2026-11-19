import { Routes, Route } from 'react-router'
import AppShell from '@/components/AppShell'
import Home from '@/pages/Home'
import Introduction from '@/pages/Introduction'
import Part1 from '@/pages/Part1'
import Part2A from '@/pages/Part2A'
import Part2B from '@/pages/Part2B'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/introduction" element={<Introduction />} />
        <Route path="/part-1" element={<Part1 />} />
        <Route path="/part-2a" element={<Part2A />} />
        <Route path="/part-2b" element={<Part2B />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
