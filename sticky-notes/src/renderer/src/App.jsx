import Notes from './components/Notes'
import PinnedNote from './components/PinnedNote'

function App() {
  // Check if this is a pinned note window
  const isPinnedWindow = window.location.hash === '#pinned'

  return <>{isPinnedWindow ? <PinnedNote /> : <Notes />}</>
}

export default App
