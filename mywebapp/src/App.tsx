import ThreeScene from './components/ThreeScene';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThreeScene />
    </ErrorBoundary>
  );
}

export default App;
