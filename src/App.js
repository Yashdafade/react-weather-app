import './App.css';
import { Analytics } from '@vercel/analytics/react';
import WeatherApp from './Components/WeatherApp/WeatherApp'

function App() {

  return (
      <div className="App">
        <WeatherApp/>
        <Analytics />
      </div>
  );
}

export default App;
