
// Convenience functions for copying the SVG code to the system clipboard.

function text_content_to_clipboard(elt) {
  navigator.clipboard.writeText(elt.textContent).then(
    function() {
      window.alert("SVG coiped to clipboard.");
    },
    function() {
      window.alert("*** FAILED TO COPY ***");
    });
}
