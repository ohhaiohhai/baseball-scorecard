export default function BaseAdvanceOptions({ baseNumber }: { baseNumber: number }) {
  return (
    <select name={`baseadvance${baseNumber}`}>
      {baseNumber === 1 ? (
        <option value="hit">Hit</option>
      ) : (
        <option value="avd">Generic</option>
      )}
      <option value="SB">Stolen Base</option>
      <option value="CS">Caught Stealing</option>
      <option value="PO">Picked Off</option>
      <option value="WP">Wild Pitch</option>
      <option value="PB">Passed Ball</option>
      <option value="BK">Balk</option>
      <option value="E">Error</option>
      <option value="FC">Fielder's Choice</option>
      <option value="DI">Defensive Indifference</option>
    </select>
  )
}