export function WebGLFallback() {
  return (
    <div className="fallback" role="status">
      <p className="fallback-kicker">3D view unavailable</p>
      <h2>WebGL is not available in this browser.</h2>
      <p>
        The assembly viewer needs WebGL. The story, bill of materials, and customer one-pager still
        open from this page. Try a current desktop browser with hardware acceleration enabled.
      </p>
    </div>
  );
}
