type PreviewFrameProps = {
  body: string;
  contentType?: string;
};

export function PreviewFrame({ body, contentType = "" }: PreviewFrameProps) {
  const isHtml =
    contentType.includes("text/html") || body.trim().startsWith("<");

  if (!isHtml) {
    return (
      <div
        className="flex h-full items-center justify-center"
        data-testid="response-preview-not-html"
      >
        <p className="text-xs text-muted-foreground">
          Preview is only available for HTML responses
        </p>
      </div>
    );
  }

  return (
    <iframe
      title="Response Preview"
      className="h-full w-full border-0 bg-background"
      sandbox="allow-scripts"
      srcDoc={body}
      data-testid="response-preview-iframe"
    />
  );
}
