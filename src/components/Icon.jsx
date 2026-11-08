export default function Icon({ name, style, className = "" }) {
  return (
    <svg className={`icon${className ? " " + className : ""}`} style={style}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
