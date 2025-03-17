import Canvas from './components/Canvas';
import './App.css';

// Replace this URL with your actual background image URL
const BACKGROUND_IMAGE = 'https://picsum.photos/800/600';

function App() {
  return (
    <div className="app">
      <h1>Fabric.js Canvas Editor</h1>
      <Canvas
        backgroundImage={BACKGROUND_IMAGE}
        width={800}
        height={600}
      />
    </div>
  );
}

export default App;
