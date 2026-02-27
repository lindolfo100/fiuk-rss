/**
 * Generates an OPML XML string from a list of feed URLs
 */
export function generateOPML(urls: string[]): string {
  const date = new Date().toUTCString();
  
  const outlines = urls.map(url => {
    // We don't have titles for all URLs in the simple array, 
    // so we use the URL as a placeholder title
    return `      <outline type="rss" text="${url}" title="${url}" xmlUrl="${url}" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Flux Aggregator Export</title>
    <dateCreated>${date}</dateCreated>
  </head>
  <body>
    <outline text="Subscriptions" title="Subscriptions">
${outlines}
    </outline>
  </body>
</opml>`;
}

/**
 * Triggers a download of the OPML file
 */
export function downloadOPML(urls: string[]) {
  const opmlContent = generateOPML(urls);
  const blob = new Blob([opmlContent], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flux-subscriptions-${new Date().toISOString().split('T')[0]}.opml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
