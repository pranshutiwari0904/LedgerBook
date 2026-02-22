import { useTheme } from '../context/ThemeContext';

const prettifyLabel = (value) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const ThemeCustomizer = () => {
  const { theme, setMode, setMajorTone, setUndertone, resetTheme, options } = useTheme();
  const majorOptions = options.majorByMode[theme.mode] || [];

  return (
    <section className="panel control-panel">
      <h3>Theme Studio</h3>
      <p className="muted-text">Choose your own visual style for light or dark mode.</p>

      <label>
        Mode
        <select value={theme.mode} onChange={(e) => setMode(e.target.value)}>
          {options.modes.map((mode) => (
            <option key={mode} value={mode}>
              {prettifyLabel(mode)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Major Tone
        <select value={theme.majorTone} onChange={(e) => setMajorTone(e.target.value)}>
          {majorOptions.map((tone) => (
            <option key={tone} value={tone}>
              {prettifyLabel(tone)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Undertone
        <select value={theme.undertone} onChange={(e) => setUndertone(e.target.value)}>
          {options.undertones.map((tone) => (
            <option key={tone} value={tone}>
              {prettifyLabel(tone)}
            </option>
          ))}
        </select>
      </label>

      <button className="ghost" onClick={resetTheme}>
        Reset Theme
      </button>
    </section>
  );
};

export default ThemeCustomizer;
