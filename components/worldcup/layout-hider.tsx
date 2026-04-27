export default function WorldcupLayoutHider() {
  return (
    <style>{`
      /* Hide main site header */
      body:has([data-worldcup]) header.sticky {
        display: none !important;
      }
      /* Hide main site footer */
      body:has([data-worldcup]) footer.border-t {
        display: none !important;
      }
      /* Hide mobile bottom nav */
      body:has([data-worldcup]) nav.fixed.bottom-0 {
        display: none !important;
      }
      /* Remove main padding-bottom */
      body:has([data-worldcup]) main.flex-1 {
        padding-bottom: 0 !important;
      }
    `}</style>
  );
}
